import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader } from '~/components/Loader';
import type { TlTweets } from '~/lib/scheme/tweets';
import { AddTweetForm } from '../../src/components/tweets/AddTweetForm';
import { LikeButton } from '../../src/components/tweets/LikeButton';
import { RepliesButton } from '../../src/components/tweets/RepliesButton';
import { Tweet } from '../../src/components/tweets/Tweet';
import TwitterLayout from '../../src/components/TwitterLayout';
import { z } from 'zod';

const notifyFailed = () => toast.error("Couldn't fetch tweet...");

// 🦁 Créer un schéma zod appelé TweetsSchema qui correspond à la réponse de l'API
const TweetsSchema = z.object({
  tweets: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      // createdAt: z.date().transform((date) => date.toISOString()),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        displayName: z.string(),
        username: z.string(),
        avatarUrl: z.string().url(),
      }),
      // likes: z.array(z.string()),
      _count: z.object({
        likes: z.number(),
        replies: z.number(),
      }),
      liked: z.boolean(),
    })
  ),
});

// const TweetsSchema = z.array(TweetSchema);

// Tu peux `console.log` la réponse de l'API pour voir la structure attendue
// Tu pourrais utiliser zod transform pour modifier directement dans le schéma la date
// 💡 const TweetsSchema = z.object({...

export default function FetchAllTweets() {
  const [tweets, setTweets] = useState<TlTweets | null>(null);
  // const [tweets, setTweets] = useState<TlTweet | null>(null);

  useEffect(() => {
    // 🦁 Créer un abort controller pour annuler la requête si l'utilisateur quitte la page
    const abortController = new AbortController();

    // 🦁 Passer le signal à la requête fetch
    fetch('/api/tweets', { signal: abortController.signal }) // ℹ️ tu peux remplacer l'url par `/api/tweets?error=erreur` pour voir le problème
      // fetch('tweets?error=erreur')
      .then((res) => res.json())
      .then((json) => TweetsSchema.parse(json))
      .then((data) => {
        // 🦁 Utiliser le schéma TweetsSchema pour valider la réponse de l'API
        // console.log(data.tweets);
        // const safeData = TweetsSchema.parse(data);
        // setTweets(safeData.tweets);
        setTweets(data.tweets);
      })
      .catch((err) => {
        //dev only
        if (err.name === 'AbortError') return;
        notifyFailed();
        setTweets([]);
      }); // 🦁 Ajouter un catch pour gérer les erreurs

    // 🦁 Créer la cleanup fonction qui annule la requête
    return () => {
      abortController.abort();
    };
  }, []);

  if (!tweets) return <Loader />;

  return (
    <TwitterLayout>
      <AddTweetForm />
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} tweet={tweet}>
          <RepliesButton count={tweet._count.replies} />
          <LikeButton count={tweet._count.likes} />
        </Tweet>
      ))}
    </TwitterLayout>
  );
}
