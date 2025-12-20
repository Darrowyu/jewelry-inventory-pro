import { handleCloudRequest } from './_handler.js'

export default async function handler(req, res) {
    return handleCloudRequest(req, res, 'transactions')
}
