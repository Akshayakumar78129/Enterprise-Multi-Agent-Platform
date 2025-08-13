import { NextPurchaseQueries } from "../../../Customer/tools/next_purchase/database/queries.js";

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}
	try {
		const { customerId, limit = 25 } = req.body || {};
		if (!customerId) return res.status(400).json({ error: 'customerId required' });
		const queries = new NextPurchaseQueries();
		const rows = await queries.getCustomerTimeline(customerId);
		const purchases = rows.slice(-limit).map(r => ({
			date: r['Txn Date'],
			category: r.product_category,
			amount: r['Sales Amount'],
			sequenceOrder: r.sequence_order
		}));
		res.status(200).json({ success: true, purchases });
	} catch (e) {
		console.error('customer-timeline error', e);
		res.status(500).json({ success: false, error: 'Internal server error' });
	}
}
