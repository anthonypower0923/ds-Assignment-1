import { Game, Soundtrack } from "../shared/types";

export const games : Game[] = [
    {
    id: 1234,
    backdrop_path: '/sRLC052ieEzkQs9dEtPMfFxYkej.jpg,',
    genre_ids: [123 , 456],
    age_rating: 'M',
    overview: '',
    copies_sold_in_first_week: 1000000,
    poster_path: '/6epeijccmJlnfvFitfGyfT7njav.jpg',
    release_date: 'February 1, 2024',
    title: 'Persona 3 Reload',
    // metacritic_rating: number,
},
];

export const soundtrack: Soundtrack[] = [
    {
    gameId: 1234,
    title: 'Deep Mentality -Reload-',
    length: '3:41',
    artists: ['Atlus_Game_Music'],
    spotify_plays: 725971,
    },
    {
        gameId: 1234,
        title: "Don't",
        length: '2:45',
        artists: ['Atlus_Game_Music'],
        spotify_plays: 3747237,
    },
]