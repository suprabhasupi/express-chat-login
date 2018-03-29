module.exports = {
	globals: {
		'ts-jest': {
			tsConfigFile: 'tsconfig.json'
    }
  },
	moduleFileExtensions: [
		'ts',
		'js'
	],
	testMatch: [
    '**/src/**/*.(test|spec).(ts|js)'
	],
	transform: {
		'^.+\\.(ts|tsx)$': './node_modules/ts-jest/preprocessor.js'
	},
	testEnvironment: 'node'
};