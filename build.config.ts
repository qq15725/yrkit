import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/cli',
  ],
  declaration: true,
  failOnWarn: false,
  rollup: {
    emitCJS: true,
  },
})
