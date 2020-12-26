const _ = require("lodash");
const {} = require("@gridsome/source-filesystem");
const listAllS3Objects = require("./src/aws/listAllS3Objects");
const initAWS = require("./src/aws/init");

module.exports = function (api, options) {
  api.loadSource(({ addCollection }) => {
    try {
      const { aws, buckets, expiration, mode = "list", key = "Data" } = options;

      const AWS = initAWS(aws);

      _.each(buckets, async (bucket) => {
        const allS3Objects = await listAllS3Objects(AWS.S3, {
          Bucket: bucket,
          mode,
          key,
        });

        const bucketCollection = addCollection({
          typeName: bucket,
        });

        _.each(allS3Objects, (object, index) => {
          bucketCollection.addNode({
            id: index,
            ...object,
          });
        });
      });
    } catch (e) {
      console.error(e);
    }
  });

  // api.onCreateNode(({ internal: { typeName }, published }, options) => {
  //   const { aws, buckets, expiration, mode = "list", key = "Data" } = options;
  //
  // });
};
module.exports.defaultOptions = () => ({
  aws: {
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
  },
  buckets: [],
  expiration: 0,
  mode: "list",
  keys: [],
});
