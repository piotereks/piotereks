
export default {
  testEnvironment: "jsdom",
  
  transform: { "^.+\\.jsx?$": "babel-jest" },
       roots: [
       "<rootDir>/src",
       "<rootDir>/__tests__"
     ],
};
