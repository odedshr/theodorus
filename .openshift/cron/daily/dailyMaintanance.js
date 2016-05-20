#!/usr/bin/env node

require ('../../../etc/updateTags').run();
require ('../../../etc/setCommunityScore.js').thorough();
require ('../../../etc/setTopicScore.js').thorough();