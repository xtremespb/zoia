import {
    programs,
    tests
} from "../shared/data";
import programsComponent from "./programs";
import modulesComponent from "./modules";
import moduleComponent from "./module";
import testComponent from "./test";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["edu"].routes.index, programsComponent(programs, tests));
    fastify.get(`/:language${fastify.zoiaModulesConfig["edu"].routes.index}`, programsComponent(programs, tests));
    fastify.get(`${fastify.zoiaModulesConfig["edu"].routes.index}/program/:programId`, modulesComponent(programs, tests));
    fastify.get(`/:language${fastify.zoiaModulesConfig["edu"].routes.index}/program/:programId`, modulesComponent(programs, tests));
    fastify.get(`${fastify.zoiaModulesConfig["edu"].routes.index}/module/:programId/:moduleId`, moduleComponent(programs, tests));
    fastify.get(`/:language${fastify.zoiaModulesConfig["edu"].routes.index}/module/:programId/:moduleId`, moduleComponent(programs, tests));
    fastify.get(`${fastify.zoiaModulesConfig["edu"].routes.index}/test/:programId/:moduleId/:testId`, testComponent(programs, tests));
    fastify.get(`/:language${fastify.zoiaModulesConfig["edu"].routes.index}/test/:programId/:moduleId/:testId`, testComponent(programs, tests));
};
