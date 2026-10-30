export interface Task { id: string; prompt: string; prompt_audio: string | null; options: string[]; correct_answer: string; explanation: string }
export interface Chapter { id: string; title: string; narration_text: string; narration_audio: string | null; tasks: Task[] }
export interface Level { id: string; title: string; tasks: Task[] }
interface LessonBase { id: string; title: string; subject: string; grade: number; language: string; description: string }
export interface StoryLesson extends LessonBase { template: "story"; chapters: Chapter[] }
export interface GameLesson extends LessonBase { template: "game"; star_thresholds: { one_star_min_correct: number; two_stars_min_correct: number; three_stars_min_correct: number }; levels: Level[] }
export type Lesson = StoryLesson | GameLesson;

export const storyLesson: StoryLesson = {
  "id": "demo-story-math-001",
  "title": "The Magical Forest Math Quest",
  "subject": "Math",
  "grade": 2,
  "language": "English",
  "template": "story",
  "description": "Help the forest animals solve three fun addition and subtraction challenges.",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "The Fox's Missing Apples",
      "narration_text": "Welcome to the Magical Forest! A little fox has seven apples. Then a friendly squirrel brings five more. Can you help the fox count all the apples?",
      "narration_audio": null,
      "tasks": [
        {
          "id": "t1",
          "prompt": "The fox has 7 apples and gets 5 more. How many apples does the fox have now?",
          "prompt_audio": null,
          "options": [
            "10",
            "12",
            "13"
          ],
          "correct_answer": "12",
          "explanation": "7 plus 5 equals 12. Great counting!"
        }
      ]
    },
    {
      "id": "chapter-2",
      "title": "The Owl's Lost Feathers",
      "narration_text": "Well done! Now meet Oliver the owl. He found nine beautiful feathers, but the wind blew four away. Let's help him find out how many feathers are left.",
      "narration_audio": null,
      "tasks": [
        {
          "id": "t2",
          "prompt": "Oliver had 9 feathers. Four blew away. How many feathers are left?",
          "prompt_audio": null,
          "options": [
            "4",
            "5",
            "6"
          ],
          "correct_answer": "5",
          "explanation": "9 minus 4 equals 5. You solved the owl's puzzle!"
        }
      ]
    },
    {
      "id": "chapter-3",
      "title": "The Bear's Honey Jars",
      "narration_text": "One last challenge! Benny the bear has six jars of honey. His friend gives him eight more jars. Help Benny count his honey jars so the forest celebration can begin!",
      "narration_audio": null,
      "tasks": [
        {
          "id": "t3",
          "prompt": "Benny has 6 jars of honey and gets 8 more. How many jars does he have?",
          "prompt_audio": null,
          "options": [
            "12",
            "13",
            "14"
          ],
          "correct_answer": "14",
          "explanation": "6 plus 8 equals 14. The forest celebration can begin!"
        }
      ]
    }
  ]
};

export const gameLesson: GameLesson = {
  "id": "demo-game-math-001",
  "title": "Number Adventure Island",
  "subject": "Math",
  "grade": 2,
  "language": "English",
  "template": "game",
  "description": "Complete three island challenges and collect stars by solving addition and subtraction questions.",
  "star_thresholds": {
    "one_star_min_correct": 1,
    "two_stars_min_correct": 2,
    "three_stars_min_correct": 3
  },
  "levels": [
    {
      "id": "level-1",
      "title": "Sunny Beach",
      "tasks": [
        {
          "id": "g1-t1",
          "prompt": "What is 4 + 3?",
          "prompt_audio": null,
          "options": [
            "6",
            "7",
            "8"
          ],
          "correct_answer": "7",
          "explanation": "4 plus 3 equals 7."
        },
        {
          "id": "g1-t2",
          "prompt": "What is 10 - 2?",
          "prompt_audio": null,
          "options": [
            "7",
            "8",
            "9"
          ],
          "correct_answer": "8",
          "explanation": "10 minus 2 equals 8."
        },
        {
          "id": "g1-t3",
          "prompt": "What is 5 + 5?",
          "prompt_audio": null,
          "options": [
            "9",
            "10",
            "11"
          ],
          "correct_answer": "10",
          "explanation": "5 plus 5 equals 10."
        }
      ]
    },
    {
      "id": "level-2",
      "title": "Jungle Bridge",
      "tasks": [
        {
          "id": "g2-t1",
          "prompt": "What is 8 + 6?",
          "prompt_audio": null,
          "options": [
            "13",
            "14",
            "15"
          ],
          "correct_answer": "14",
          "explanation": "8 plus 6 equals 14."
        },
        {
          "id": "g2-t2",
          "prompt": "What is 13 - 5?",
          "prompt_audio": null,
          "options": [
            "7",
            "8",
            "9"
          ],
          "correct_answer": "8",
          "explanation": "13 minus 5 equals 8."
        },
        {
          "id": "g2-t3",
          "prompt": "What is 9 + 4?",
          "prompt_audio": null,
          "options": [
            "12",
            "13",
            "14"
          ],
          "correct_answer": "13",
          "explanation": "9 plus 4 equals 13."
        }
      ]
    },
    {
      "id": "level-3",
      "title": "Treasure Mountain",
      "tasks": [
        {
          "id": "g3-t1",
          "prompt": "What is 15 - 7?",
          "prompt_audio": null,
          "options": [
            "7",
            "8",
            "9"
          ],
          "correct_answer": "8",
          "explanation": "15 minus 7 equals 8."
        },
        {
          "id": "g3-t2",
          "prompt": "What is 7 + 8?",
          "prompt_audio": null,
          "options": [
            "14",
            "15",
            "16"
          ],
          "correct_answer": "15",
          "explanation": "7 plus 8 equals 15."
        },
        {
          "id": "g3-t3",
          "prompt": "What is 16 - 9?",
          "prompt_audio": null,
          "options": [
            "6",
            "7",
            "8"
          ],
          "correct_answer": "7",
          "explanation": "16 minus 9 equals 7."
        }
      ]
    }
  ]
};

export const lessons: Lesson[] = [storyLesson, gameLesson];
export const getLesson = (id: string) => lessons.find((l) => l.id === id);
