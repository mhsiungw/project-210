import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({ region: process.env.AWS_REGION })

const bucket = (): string => {
  const name = process.env.S3_BUCKET_NAME
  if (!name) throw new Error('S3_BUCKET_NAME is not set')
  return name
}

export async function getPresignedPutUrl(key: string, expiresIn: number = 900): Promise<string> {
  const command = new PutObjectCommand({ Bucket: bucket(), Key: key })
  return getSignedUrl(s3, command, { expiresIn })
}

export async function getPresignedGetUrl(key: string, expiresIn: number = 900): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket(), Key: key })
  return getSignedUrl(s3, command, { expiresIn })
}
