const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');

// Get all scene directories
const sceneDirectories = fs.readdirSync(path.resolve(__dirname, 'src'))
  .filter(file => fs.statSync(path.join(__dirname, 'src', file)).isDirectory());

// Create entry points and HTML plugins for each scene
const entry = {
  main: './src/index.js',
};

const htmlPlugins = [
  new HtmlWebpackPlugin({
    template: './src/index.html',
    filename: 'index.html',
    chunks: ['main'],
  }),
];

sceneDirectories.forEach(dir => {
  entry[dir] = `./src/${dir}/index.js`;
  htmlPlugins.push(
    new HtmlWebpackPlugin({
      template: `./src/${dir}/index.html`,
      filename: `${dir}/index.html`,
      chunks: [dir],
    })
  );
});

module.exports = {
  mode: 'development',
  entry,
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: htmlPlugins,
  devServer: {
    static: './dist',
  },
};