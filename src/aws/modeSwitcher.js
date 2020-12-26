import getS3Object from "./getS3Object";

export default async (S3, objects, Bucket, mode, key, expiration) => {
  const contents = _.get(objects, "Contents");
  const result = [];
  if (!_.isEmpty(objects) && !_.isEmpty(contents)) {
    _.each(contents, async (object) => {
      const url = S3.getSignedUrl("getObject", {
        Bucket,
        Key: object.key,
        Expires: expiration,
      });

      switch (mode) {
        case "list": {
          result.push({
            ...object,
            Bucket,
            Url: url,
          });
          return result;
        }
        case "object": {
          const fullObject = await getS3Object(S3, {
            Bucket,
            Key: object.Key,
          });
          result.push({
            Key: object.key,
            Bucket,
            Url: url,
            [key]: JSON.parse(fullObject.Body.toString()),
          });
          return result;
        }
      }
    });
  } else {
    console.error("Empty Bucket");
  }
};
