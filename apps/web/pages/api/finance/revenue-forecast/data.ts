import { NextApiRequest, NextApiResponse } from 'next';

const handler = require('../../../../Finance/tools/revenue_forecast/api/data.api');

export default async function apiHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handler(req, res);
}