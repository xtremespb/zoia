import apiQuestions from "./apiQuestions";
import apiAnswers from "./apiAnswers";
import apiFinish from "./apiFinish";

export default fastify => {
    fastify.post("/api/edu/questions", apiQuestions());
    fastify.post("/api/edu/answers", apiAnswers());
    fastify.post("/api/edu/finish", apiFinish());
};
