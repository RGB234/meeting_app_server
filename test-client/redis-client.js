const { createClient } = require('redis');

const client = createClient({
  // redis[s]://[[username][:password]@][host][:port][/db-number]:
  url: 'localhost:6379',
  socket: {
    connectTimeout: 3000,
  },
});

client.on('error', (err) => console.log('Redis Client Error', err));

const test = async () => {
  await client.connect();

  await client.set('foo', 'bar');
  const value = await cluster.get('foo');
  console.log(value); // returns 'bar'

  await cluster.quit();
};

test();
