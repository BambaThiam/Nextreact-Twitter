import { toast } from 'react-hot-toast';
import { Error } from '~/components/Error';
import { Loader } from '~/components/Loader';
import { AddTweet } from '~/components/tweets/AddTweet';
import { TweetsNextButton } from '~/components/tweets/TweetsNextButton';
import { useInfiniteTweets } from '~/lib/tweets/query.tweet';
import { LikeButton } from '../../src/components/tweets/LikeButton';
import { RepliesButton } from '../../src/components/tweets/RepliesButton';
import { Tweet } from '../../src/components/tweets/Tweet';
import TwitterLayout from '../../src/components/TwitterLayout';
import { client } from '~/lib/client/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useUser } from '~/hooks/UserProvider';
import { TlTweetsPage } from '~/lib/scheme/tweets';

export default function OptimisticUpdate() {
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useInfiniteTweets();

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <Error error="Couldn't fetch tweet..." reset={() => refetch()} />;
  }

  const tweets = data.pages.flatMap((page) => page.tweets);

  return (
    <TwitterLayout>
      <AddTweet />
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} tweet={tweet}>
          <RepliesButton count={tweet._count.replies} />
          <Like
            tweetId={tweet.id}
            liked={tweet.liked}
            count={tweet._count.likes}
          />
        </Tweet>
      ))}
      <TweetsNextButton
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </TwitterLayout>
  );
}

const notifyFailed = () => toast.error("Couldn't like tweet");

const likeTweet = async (tweetId: string, liked: boolean) => {
  // 🦁 Utilise `client` pour faire un appel à l'API
  // url : `/api/tweets/${tweetId}/like`
  // la method sera DELETE si liked est true, POST sinon
  // data : { userId }
  client(`/api/tweets/${tweetId}/like`, {
    method: liked ? 'DELETE' : 'POST',
    data: { userId: 'todo' },
  });
  return 'todo';
};

type LikeUpdateProps = {
  tweetId: string;
  count: number;
  liked: boolean;
};

const tweetKeys = {
  all: ['tweets'] as const,
  list: (limit: number) => [...tweetKeys.all, { tweets: { limit } }] as const,
  byId: (id: string) => [...tweetKeys.all, { tweet: { id } }] as const,
};

const Like = ({ count, liked, tweetId }: LikeUpdateProps) => {
  // 🦁 Créer un state isLoading
  // 🦁 Utilise useQueryClient

  // 🦁 Ajoute la fonction onClick
  // * mettre isLoading à true
  // * utiliser la fonction likeTweet
  // * si c'est un succès (`.then`) : invalider la query des tweets (tu pourras trouver la clé dans [query.tweet.ts](src/lib/tweets/query.tweet.ts) et l'importer)
  // * si c'est un échec (`.catch`) : afficher un message d'erreur
  // * finalement (`.finally`) on va définir le state `isLoading` à false et le mettre à true pendant

  const queryClient = useQueryClient();
  const { user } = useUser();

  const mutation = useMutation({
    mutationFn: () => {
      return likeTweet(tweetId, liked);
    },

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: tweetKeys.all,
      });

      const previousValue = queryClient.getQueriesData(tweetKeys.all);

      queryClient.setQueryData(
        tweetKeys.all,
        (old?: { pages: TlTweetsPage[] }) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              tweets: page.tweets.map((tweet) => {
                if (tweet.id !== tweetId) {
                  return tweet;
                }

                return {
                  ...tweet,
                  liked: !liked,
                  _count: {
                    ...tweet._count,
                    likes: tweet._count.likes + (liked ? -1 : 1),
                  },
                };
              }),
            })),
          };
        }
      );

      return { previousValue };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tweetKeys.all,
        refetchPage: (lastPage: TlTweetsPage) => {
          return lastPage.tweets.some((tweet) => tweet.id === tweetId);
        },
      });
    },
    onError: (err, variables, context) => {
      queryClient.setQueriesData(tweetKeys.all, context?.previousValue);
      notifyFailed();
    },
  });

  return (
    <LikeButton
      count={count}
      disabled={!user || mutation.isLoading}
      onClick={() => {
        // 🦁 Appelle la fonction onClick
        mutation.mutate();
      }}
      liked={liked}
    />
  );
};
