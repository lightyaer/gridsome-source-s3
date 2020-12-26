export default async (S3, { Bucket, ContinuationToken, ...params }) => {
  try {
    return await S3.listObjectsV2({
      Bucket,
      ContinuationToken,
      ...params,
    }).promise();
  } catch (e) {
    return e;
  }
};
