import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'
import {basename} from 'path'
import {execSync} from 'child_process'
import * as pkg from '../package.json'


const headHash = getGitHEADHash()
const input = 'tslib/module/bundle.js'
const name = 'bundle'
const target = 'WebContent/js/lib/bundle'
const deps = pkg.dependencies

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = ! process.env.ROLLUP_WATCH
const now = new Date()

const globals = {
  'rxjs/operators': 'rxjs.operators',
  'rxjs/websocket': 'rxjs.websocket',
}
const external = [
  'rxjs', 'rxjs/operators', 'rxjs/websocket', 'rxjs/ajax',
]
const nodeModule = [
  'fs', 'path', 'util', 'os',
]

for (const depName of Object.keys(deps)) {
  external.push(depName)
}


const banner = `
/**
 * BUILD INFO
 * VER: ${pkg.version}
 * FILE: ${basename(target)}.umd.min.js
 * TIME: ${now}
 * HEAD: ${headHash}
 */
`.trimLeft()

const uglifyOpts = {
  mangle:   true,
  compress: {
    unused:        false,
    sequences:     true,
    dead_code:     true,
    conditionals:  true,
    booleans:      true,
    if_return:     true,
    join_vars:     true,
    drop_console:  false,
    drop_debugger: false,
    typeofs:       false,
  },
  output: {
    preamble: banner,
  },
}

const config = [
  // bundle min
  {
    external: nodeModule,
    input,
    plugins:  [
      resolve({
        browser: true,
        jsnext:  true,
        main:    true,
      }),
      commonjs(),
      production && terser(uglifyOpts), // without minfiy during developing
    ],
    output: {
      amd:       {id: name},
      banner,
      file:      `${target}.umd.min.js`,
      format:    'umd',
      globals,
      name,
      sourcemap: production ? true : false,
    },
  },

]


// remove pkg.name extension if exists
function parseName(name) {
  if (name) {
    const arr = name.split('.')
    const len = arr.length

    if (len > 2) {
      return arr.slice(0, -1).join('.')
    }
    else if (len === 2 || len === 1) {
      return arr[0]
    }
  }
  return name
}

function getGitHEADHash() {
  const buf = execSync('git rev-parse HEAD')
  const hash = buf.toString('utf8')


  if (! hash) {
    console.info('获取 GIT 提交记录失败')
    process.exit(1)
  }
  return hash.trim()
}


export default config

