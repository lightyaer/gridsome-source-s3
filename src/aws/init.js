const AWS = require("aws-sdk");

export default (aws) => {
  AWS.config.update(aws);
  return AWS;
};
