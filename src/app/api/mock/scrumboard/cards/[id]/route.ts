import mockApi from 'src/@mock-utils/mockApi';
import { ScrumboardCard } from '@/app/(control-panel)/apps/scrumboard/api/types';

/**
 * GET api/mock/scrumboard/cards/{id}
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params;
	const api = mockApi('scrumboard_cards');
	const item = await api.find<ScrumboardCard>(id);

	if (!item) {
		return new Response(JSON.stringify({ message: 'Item not found' }), { status: 404 });
	}

	return new Response(JSON.stringify(item), { status: 200 });
}

/**
 * PUT api/mock/scrumboard/cards/{id}
 */
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params;
	const api = mockApi('scrumboard_cards');
	const data = (await req.json()) as ScrumboardCard;
	const updatedItem = await api.update<ScrumboardCard>(id, data);

	if (!updatedItem) {
		return new Response(JSON.stringify({ message: 'Item not found' }), { status: 404 });
	}

	return new Response(JSON.stringify(updatedItem), { status: 200 });
}

/**
 * DELETE api/mock/scrumboard/cards/{id}
 */
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params;
	const api = mockApi('scrumboard_cards');

	const result = await api.delete([id]);

	if (!result.success) {
		return new Response(JSON.stringify({ message: 'Item not found' }), { status: 404 });
	}

	return new Response(JSON.stringify({ message: 'Deleted successfully' }), { status: 200 });
}
