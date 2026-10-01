import { handleCDRequest, type CDEnv } from '../../server/cd/api';

export const onRequest = ({ request, env }: { request: Request; env: CDEnv }) => handleCDRequest(request, env);
