import { Game, Song } from "../shared/types";

export const games : Game[] = [
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
{
    id: 2345,
    backdrop_path: "/sRLC052ieEzkQs9dEtPMfFxYkej.jpg,",
    genre_ids: [123 , 456],
    age_rating: "M",
    overview: "Two larger-than-life heroes, Ichiban Kasuga and Kazuma Kiryu are brought together by the hand of fate, or perhaps something more sinister… Live it up in Japan and explore all that Hawaii has to offer in an RPG adventure so big it spans the Pacific",
    copies_sold_in_first_week: 1000000,
    poster_path: "/6epeijccmJlnfvFitfGyfT7njav.jpg",
    release_date: "January 26, 2024",
    title: "Like a Dragon: Infinitte Wealth",
    developed_by: "RGG Studio",
    publishers: "Sega"
},
];

export const songs: Song[] = [
    {
    gameId: 1234,
    title: 'Deep Mentality -Reload-',
    length: '3:41',
    artists: ['Atlus Game Music'],
    spotify_plays: 725971,
    },
    {
    gameId: 1234,
    title: "Don't",
    length: '2:45',
    artists: ['Atlus Game Music', 'Lotus Juice'],
    spotify_plays: 3747237,
    },
    {
    gameId: 1234,
    title: "It's Going Down Now",
    length: '3:06',
    artists: ['Atlus Game Music', 'Lotus Juice'],
    spotify_plays: 45425409
    },
]