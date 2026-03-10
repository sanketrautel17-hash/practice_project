export const readApiResponse = async (response) => {
    const rawBody = await response.text();
    if (!rawBody) {
        return {};
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        const isHtmlResponse = /^\s*</.test(rawBody);
        if (isHtmlResponse) {
            return { message: 'Server returned an unexpected response. Check backend API and proxy.' };
        }
        return { message: rawBody };
    }
};
