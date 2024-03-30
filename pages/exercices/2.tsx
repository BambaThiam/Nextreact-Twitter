import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader } from '~/components/Loader';
import { client } from '~/lib/client/client';
import type { TlTweets } from '~/lib/scheme/tweets';
import { TweetsScheme } from '~/lib/scheme/tweets';
import { AddTweetForm } from '../../src/components/tweets/AddTweetForm';
import { LikeButton } from '../../src/components/tweets/LikeButton';
import { RepliesButton } from '../../src/components/tweets/RepliesButton';
import { Tweet } from '../../src/components/tweets/Tweet';
import TwitterLayout from '../../src/components/TwitterLayout';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Error } from '~/components/Error';
import AddTweet_Bis from '~/components/tweets/AddTweet_Bis';

const notifyFailed = () => toast.error("Couldn't fetch tweet...");

const getTweets = async (signal?: AbortSignal, page = 0) =>
  client(`/api/tweets?page=${page}`, { signal, zodSchema: TweetsScheme });

export default function FetchAllTweets() {
  // 💣 Tu peux supprimer ce state
  // const [tweets, setTweets] = useState<TlTweets | null>(null);

  // 🦁 Remplace tout ceci en utilisant `useQuery` de `react-query`
  // useEffect(() => {
  //   const abortController = new AbortController();

  //   getTweets(abortController.signal)
  //     .then((data) => {
  //       setTweets(data.tweets);
  //     })
  //     .catch((err) => {
  //       if (err.name === 'AbortError') return;

  //       notifyFailed();
  //       setTweets([]);
  //     });

  //   return () => abortController.abort();
  // }, []);

  // const { data, isError, isLoading, refetch } = useQuery({
  const {
    data,
    isError,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['tweets'],
    queryFn: ({ signal, pageParam = 0 }) => getTweets(signal, pageParam),
    onError: () => notifyFailed(),
    // getPreviousPageParam: (lastPage) => lastPage.previousPage ?? undefined,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });

  // 🦁 Remplace la vérification de `tweets` par un `isLoading` de `useQuery`
  if (isLoading) return <Loader />;

  // 🦁 Affiche une erreur si `isError` est `true`
  if (isError)
    return <Error error="Couldn't fetch tweet..." reset={() => refetch()} />;

  // console.log(data);

  const tweets = data.pages?.flatMap((page) => page.tweets);

  // console.log(tweets);

  const nextPageStatus = hasNextPage ? 'hasNextPage' : 'noNextPage';

  return (
    <TwitterLayout>
      <AddTweet />
      {/* <AddTweet_Bis /> */}
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} tweet={tweet}>
          <RepliesButton count={tweet._count.replies} />
          <LikeButton count={tweet._count.likes} liked={tweet.liked} />
        </Tweet>
      ))}
      <button onClick={() => fetchNextPage()} className="block py-4">
        {isFetchingNextPage ? 'Loading more...' : nextPageStatus}
      </button>
    </TwitterLayout>
  );
}

const AddTweet = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    (content: string) =>
      client('/api/tweets', { method: 'POST', data: { content } }),
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ['tweets'],
        });
      },
    }
  );

  const handleSubmit = (content: string) => {
    mutation.mutate(content);
  };

  return <AddTweetForm disabled={mutation.isLoading} onSubmit={handleSubmit} />;
};
