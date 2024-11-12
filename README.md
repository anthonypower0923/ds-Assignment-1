## Serverless REST Assignment - Distributed Systems.

__Name:__ ....Anthony Power .....

__Demo:__ ... https://youtu.be/ifMcOecZd48 ......

### Context.

The context of the API is a to store information about video games and the songs in their soundtracks.
The two types in this API are 'games' and 'songs'
Below is an example of a game.
```
    {
    id: 1234,
    backdrop_path: '/sRLC052ieEzkQs9dEtPMfFxYkej.jpg,',
    genre_ids: [123 , 456],
    age_rating: 'M',
    overview: 'Dive into the Dark Hour and awaken the depths of your heart. Persona 3 Reload is a captivating reimagining of the genre-defining RPG, reborn for the modern era with cutting-edge graphics and gameplay.',
    copies_sold_in_first_week: 1000000,
    poster_path: '/6epeijccmJlnfvFitfGyfT7njav.jpg',
    release_date: 'February 1, 2024',
    title: 'Persona 3 Reload',
    developed_by: 'Atlus',
    publishers: 'Sega'
},
```
Each game in theory has a sountrack linked to it and songs in that soundtrack.
An example of a song is shown below.
```
{
gameId: 1234,
    title: "Don't",
    length: '2:45',
    artists: ['Atlus Game Music', 'Lotus Juice'],
    spotify_plays: 3747237,
    },
```

### App API endpoints.

+ DELETE /prod/protected/games - Delete a game by putting the games ID in the request body as JSON
+ POST /prod/protected/games - Add a game by posting a request body and uses ajv validation to check if valid body
+ GET /prod/public/games - Get all games.
+ GET prod/public/soundtrack?gameId={gameId} - Get soundtrack for a game. Has optional arguments of title={song_title} and artist={song_artist}
+ GET /prod/public/{gameId} - Get game with {gameId} optional arguments of translate={language_code} to translate game overview and soundtrack=True to fetch the songs for that game

### Translation 

The overview of a game is translated but the translation is not persisted.

