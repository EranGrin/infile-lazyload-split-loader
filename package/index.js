const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");
const fs = require('fs');
const pathNode = require('path');

module.exports = function (source) {
    const callback = this.async();

    let ast;
    try {
        ast = parser.parse(source, {
            sourceType: 'module',
        });
    } catch (error) {
        return callback(error);
    }

    let asyncOperationsCount = 0;
    let hasErrored = false;

    const processLazyLoad = (declarationPath, functionName, functionCode, isArrowFunc) => {
        asyncOperationsCount++;
        const chunkName = `${functionName}.lazy.js`;
        const exportCode = `export default ${functionCode}`;
        const outputPath = this._compiler.outputPath;
        const filePath = pathNode.join(outputPath, chunkName);

        fs.writeFile(filePath, exportCode, (err) => {
            if (err) {
                if (!hasErrored) {
                    hasErrored = true;
                    callback(err);
                }
                return;
            }

            if (isArrowFunc) {

            // Construct the new async function
            const newFunction = t.functionExpression(
                t.identifier(functionName),
                [],
                t.blockStatement([
                    t.variableDeclaration('const', [
                        t.variableDeclarator(
                            t.identifier('module'),
                            t.awaitExpression(
                                t.callExpression(t.import(), [
                                    t.stringLiteral(filePath)
                                ])
                            )
                        )
                    ]),
                    // Create the return statement with a function call on default
                    t.returnStatement(
                        t.logicalExpression(
                            "||",
                            t.callExpression(
                                t.memberExpression(t.identifier('module'), t.identifier('default')),
                                [] // This represents the function call
                            ),
                            t.identifier('module')
                        )
                    )
                ]),
                false,
                true
            );

            const newVariableDeclarator = t.variableDeclarator(
                t.identifier(functionName),
                newFunction
            );

                declarationPath.replaceWith(newVariableDeclarator);
            } else {
                const newFunctionCode = `
                async function ${functionName}() {
                  const module = await import("${filePath}");
                  return module.default() || module;
                }
              `;
              
              const newAst = parser.parse(newFunctionCode, {sourceType: 'module'});
              declarationPath.replaceWith(newAst.program.body[0]);
            }

            asyncOperationsCount--;

            if (asyncOperationsCount === 0 && !hasErrored) {
                const output = generate(ast, {}, source);
                callback(null, output.code);
            }
        });
    };

    traverse(ast, {
        ExportNamedDeclaration(path) {
            let comments = path.node.leadingComments;
            if (t.isFunctionDeclaration(path.node.declaration)) {
                comments = path.node.declaration.leadingComments || path.node.leadingComments;
                if (comments && comments.some(comment => comment.value.includes('@lazy-load'))) {
                    const functionName = path.node.declaration.id.name;
                    const functionCode = generate(path.node.declaration).code;
                    processLazyLoad(path.get('declaration'), functionName, functionCode, isArrowFunc = false);
                }
            } else if (t.isVariableDeclaration(path.node.declaration)) {
                path.get('declaration.declarations').forEach(declarationPath => {
                    const declaration = declarationPath.node;
                    comments = declaration.leadingComments || path.node.leadingComments;
                    if (t.isVariableDeclarator(declaration) && (t.isArrowFunctionExpression(declaration.init) || t.isFunctionExpression(declaration.init)) && comments && comments.some(comment => comment.value.includes('@lazy-load'))) {
                        const functionName = declaration.id.name;
                        const functionCode = generate(declaration.init).code;
                        processLazyLoad(declarationPath, functionName, functionCode, isArrowFunc = true );
                    }
                });
            }
        }
    });

    if (asyncOperationsCount === 0) {
        const output = generate(ast, {}, source);
        callback(null, output.code);
    }
};
