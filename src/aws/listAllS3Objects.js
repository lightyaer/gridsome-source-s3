const modeSwitcher = require("./modeSwitcher");

const listS3Objects = require("./listS3Objects");
const _ = require("lodash");

export default async (S3, { Bucket, mode, key }) => {
  let allObjects = [];
  const currentObjects = await listS3Objects(S3, { Bucket });

  allObjects = [
    ...allObjects,
    ...(await modeSwitcher(S3, currentObjects, Bucket, mode, key)),
  ];

  const isTruncated = _.get(currentObjects, "IsTruncated");
  const nextContinuationToken = _.get(currentObjects, "NextContinuationToken");

  let next = currentObjects && isTruncated && nextContinuationToken;

  while (next) {
    const nextObjects = await listS3Objects({
      Bucket,
      ContinuationToken: next,
    });
    allObjects = [
      ...allObjects,
      ...(await modeSwitcher(S3, nextObjects, Bucket, mode, key)),
    ];
  }

  return allObjects;
};
