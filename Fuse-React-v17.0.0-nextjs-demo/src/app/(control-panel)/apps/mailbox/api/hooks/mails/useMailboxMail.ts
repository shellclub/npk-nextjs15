import { useQuery } from '@tanstack/react-query';
import { mailboxApi } from '../../services/mailboxApiService';
import useParams from '@fuse/hooks/useParams';

export const mailboxMailQueryKey = (mailId: string) => ['mailbox', 'mail', mailId];

export const useMailboxMail = () => {
	const routeParams = useParams<{ mailParams: string[] }>();
	const [, , mailId] = routeParams?.mailParams || [];

	return useQuery({
		queryFn: () => mailboxApi.getMail(mailId),
		queryKey: mailboxMailQueryKey(mailId),
		enabled: !!mailId
	});
};
