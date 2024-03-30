import { client } from '~/lib/client/client';
import { AddTweetForm } from './AddTweetForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const addTweet = async (content: string) => {
  client('/api/tweets', { method: 'POST', data: { content } });
};

const AddTweet_Bis = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation(addTweet, {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tweets'] });
    },
  });

  const handleSubmit = (content: string) => {
    mutation.mutate(content);
  };

  return (
    <div>
      <AddTweetForm onSubmit={handleSubmit} disabled={mutation.isLoading} />
    </div>
  );
};

export default AddTweet_Bis;
