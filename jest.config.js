module.exports = {
    testMatch: ["**/?(*.)+(spec).+(ts|tsx)"],
    transform: {
        "^.+\\.(ts|tsx)?$": "ts-jest",
    },
    testEnvironment: "jsdom",
};
