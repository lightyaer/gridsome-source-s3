const _ = require("lodash");
const AWS = require("aws-sdk");
const chalk = require("chalk");

module.exports = function (api, options) {
  api.loadSource(async (actions) => {
    const { aws, buckets, mode = "list" } = options;
    const s3Buckets = _.castArray(buckets);
    AWS.config.update(aws);
    const S3 = new AWS.S3();

    const getS3List = async ({ Bucket, ContinuationToken }) => {
      return await S3.listObjectsV2({
        Bucket,
        ContinuationToken,
      })
        .promise()
        .catch((e) =>
          console.log(`Error in listing objects from ${Bucket}, ${e}`)
        );
    };

    const listAllObjects = async ({ bucket, mode = "list" }) => {
      const allS3Objects = [];
      const currentData = await getS3List({ Bucket: bucket });

      const contents = _.get(currentData, "Contents", []);

      const addObject = async (contents) => {
        if (!_.isEmpty(contents)) {
          for (let object of contents) {
            if (mode === "list") {
              allS3Objects.push({ ...object });
            } else {
              const fullObject = await getObject({
                Bucket: bucket,
                Key: object.Key,
              });

              allS3Objects.push({
                ...JSON.parse(fullObject.Body.toString()),
              });
            }
          }
        } else {
          console.error(
            `Error processing objects from bucket "${bucket}". Is it empty?`
          );
        }
      };

      await addObject(contents);

      const isTruncated = _.get(currentData, "IsTruncated", false);
      const nextContinuationToken = _.get(
        currentData,
        "NextContinuationToken",
        null
      );

      let nextToken = currentData && isTruncated && nextContinuationToken;

      while (nextToken) {
        const nextData = await getS3List({
          Bucket: bucket,
          ContinuationToken: nextToken,
        });
        const contents = _.get(nextData, "Contents", []);

        await addObject(contents);

        const isTruncated = _.get(nextData, "IsTruncated", false);
        const nextContinuationToken = _.get(
          nextData,
          "NextContinuationToken",
          null
        );

        nextToken = nextData && isTruncated && nextContinuationToken;
      }

      return allS3Objects;
    };

    const getObject = async ({ Bucket, Key }) => {
      return await S3.getObject({
        Bucket,
        Key,
      })
        .promise()
        .catch((e) =>
          console.log(
            `Error in getting object from ${Bucket} bucket and ${Key} key, ${e}`
          )
        );
    };

    try {
      _.each(s3Buckets, async (bucket) => {
        const collectionName = _.upperFirst(_.camelCase(bucket));

        console.log(
          chalk.green(
            chalk.blue.underline.bold("Adding to collection") + collectionName
          )
        );

        const collection = actions.addCollection({
          typeName: collectionName,
        });

        let objects = await Promise.all(
          await listAllObjects({
            bucket,
            mode,
          })
        );
        console.log(objects);

        objects = _.flatten(objects);

        objects.forEach((object, index) => {
          collection.addNode({ id: index, ...object });
        });
      });
    } catch (e) {
      console.error(e);
    }
  });
};

module.exports.defaultOptions = () => ({
  aws: {
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
  },
  buckets: [],
  expiration: 0,
  mode: "object",
  keys: "data",
});
