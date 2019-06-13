import 'qunit';
import main ,{ isDefineExpression } from '../src/babel-plugin-adjust-imports';
import Types  = require('@babel/types');
import { transformSync } from "@babel/core";

const { test, skip } = QUnit;

QUnit.module('babel-plugin-adjust-imports');

import { parse } from '@babel/parser';
import traverse from "@babel/traverse";

function getFirstCallExpresssionPath(source: string) {
  const ast = parse(source, {
    sourceType: 'module'
  });

  let path: any;

  traverse(ast, {
    CallExpression(_path: any) {
      if (path) { return; }
      path = _path;
    }
  });

  return path;
}

function isDefineExpressionFromSource(source: string) {
  return isDefineExpression(Types, getFirstCallExpresssionPath(source));
}

test('isDefineExpression works', function(assert) {
  assert.equal(isDefineExpressionFromSource(`apple()`), false);
  assert.equal(isDefineExpressionFromSource(`(apple())`), false);
  assert.equal(isDefineExpressionFromSource(`(define('module', [], function() { }))`), true);
  assert.equal(isDefineExpressionFromSource(`define('module', [], function() {});`), true);
  assert.equal(isDefineExpressionFromSource(`define('foo', ['apple'], function() {});`), true);
  assert.equal(isDefineExpressionFromSource(`define;define('module', [], function() {});`), true);
  assert.equal(isDefineExpressionFromSource(`define;define('module', function() {});`), false);
  assert.equal(isDefineExpressionFromSource(`define;define('module');`), false);
  assert.equal(isDefineExpressionFromSource(`define;define(1, [], function() { });`), false);
  assert.equal(isDefineExpressionFromSource(`define;define('b/a/c', ['a', 'b', 'c'], function() { });`), true);
  assert.equal(isDefineExpressionFromSource(`import foo from 'foo'; define('apple')`), false);
  assert.equal(isDefineExpressionFromSource(`define('apple'); import foo from 'foo'`), false);
});

skip('main', function(assert) {
  const a = transformSync(`define('module', ['a', 'b', 'c'], function() {})`, {
    plugins: [
      main,
      { relocatedFiles: {}, renameModules: {}, renamePackages: {} }
    ]
  }) as any;
  assert.equal(a.code, `define('module', ["1", "1", "1"], function () {});`);


  const b = transformSync(`import apple from 'apple'`, {
    plugins: [
      main,
      { relocatedFiles: {}, renameModules: {}, renamePackages: {} }
    ]
  }) as any;
  assert.equal(b.code, `import apple from 'apple'`);
});
