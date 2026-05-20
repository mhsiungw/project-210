import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import { Resource } from 'sst'

export function signCloudFrontUrl(url: string, expiresInSeconds: number = 3600): string {
  const privateKey = Buffer.from(Resource.CLOUDFRONT_PRIVATE_KEY.value, 'base64').toString('utf-8')

  const keyPairId = Resource.CLOUDFRONT_KEY_PAIR_ID.value

  const dateLessThan = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

  return getSignedUrl({
    url,
    keyPairId,
    privateKey,
    dateLessThan,
  })
}
