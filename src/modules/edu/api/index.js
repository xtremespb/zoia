import apiQuestions from "./apiQuestions";

export default fastify => {
    fastify.post("/api/edu/questions", apiQuestions());
};
