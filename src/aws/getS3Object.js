export default async (S3, { Bucket, Key }) => {
  try {
    return await S3.getObject({
      Bucket,
      Key,
    });
  } catch (e) {
    return e;
  }
};
