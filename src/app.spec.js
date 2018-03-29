const add = require('./sample.ts')

describe("Add function", () => {
  it("should return 200 OK", () => {
    expect(add(1,2)).toBe(3)
  });
});
