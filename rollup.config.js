import {minify} from "uglify-es"
import commonjs from "rollup-plugin-commonjs"
import filesize from "rollup-plugin-filesize"
import resolve from "rollup-plugin-node-resolve"
import uglify from "rollup-plugin-uglify"
import typescript from 'rollup-plugin-typescript'

function getConfig(dest, format, ugly) {
    const conf = {
        input: "src/remmi.tsx",
        output: {
            exports: "named",
            file: dest,
            format,
            name: "remmi",
            sourcemap: true
        },
        external: ["react", "react-dom"],
        plugins: [
            typescript({
                typescript: require("typescript")
            }),
            resolve({
                jsnext: true
            }),
            commonjs(),
            ugly &&
                uglify(
                    {
                        warnings: true,
                        toplevel: true,
                        sourceMap: true,
                        mangle: {
                            properties: false /* {
                                    reserved: [
                                        "module",
                                        "exports",
                                        "default",
                                        "value", // for the esModule = true defintion
                                        "setUseProxies",
                                        "setAutoFreeze"
                                    ]
                                } */
                        }
                    },
                    minify
                ),
            filesize()
        ].filter(Boolean)
    }

    return conf
}

const config = [
    getConfig("dist/remmi.js", "cjs", false),
    getConfig("dist/remmi.umd.js", "umd", true),
    getConfig("dist/remmi.module.js", "es", false)
]

export default config
