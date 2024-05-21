# Infile-LazyLoad-Split-Loader
## A Webpack loader for lazy loading functions marked with `@lazy-load
Infile-LazyLoad-Split-Loader is a Webpack loader designed to enhance your JavaScript projects by automatically splitting and lazily loading functions marked with a `@lazy-load` comment. This approach helps in reducing the initial load time of your applications by splitting off heavy functions into separate chunks that load only when needed.

## Features

- **Lazy Loading**: Automatically transforms and splits marked functions into separate chunks.
- **Easy Integration**: Seamlessly integrates with your existing Webpack setup.
- **Configurable**: Offers options to customize the lazy loading behavior.

## Installation

Install the loader via npm:

```bash
npm install infile-lazyload-split-loader --save-dev
```
Or via yarn:
```bash
yarn add infile-lazyload-split-loader --dev
```

## Usage
To use the Infile-LazyLoad-Split-Loader, add it to your Webpack configuration:

```javascript
// webpack.config.js
    module.exports = {
    module: {
        rules: [
        {
            test: /\.js$/,
            use: [
            {
                loader: 'infile-lazyload-split-loader',
                options: {
                // Optional configuration settings
                }
            }
            ]
        }
        ]
    }
    };
```

In your JavaScript files, mark the functions you want to lazy load with the `@lazy-load` comment: 
```javascript
// myModule.js

    // @lazy-load
    export function heavyFunction() {
     // to be be split off into a separate chunk
    }

    // @lazy-load
    export const anotherHeavyFunction() => {
     // to be be split off into a separate chunk
    }
```

in your main file, import the function as you would normally do for named exports. The loader will automatically split off the marked functions into separate chunks and load them only when needed. For example:
```javascript
// main.js

    import { heavyFunction, anotherHeavyFunction } from './myModule.js';

    heavyFunction();
    anotherHeavyFunction();
```

## Limitations

- The loader currently only supports inline functions.
- No function call from outside the function is allowed.

## License
MIT



