import topics from "~/assets/data/topics.json";

// Helper function to fix SVG paths for deployment
function fixSvgPaths(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const basePath = process.env.DEPLOY_ENV === "GH_PAGES" ? "/pregnancy-app" : "";
  
  const result = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (key === 'icon' && typeof obj[key] === 'string' && obj[key].startsWith('/img/')) {
      result[key] = basePath + obj[key];
    } else if (typeof obj[key] === 'object') {
      result[key] = fixSvgPaths(obj[key]);
    } else {
      result[key] = obj[key];
    }
  }
  
  return result;
}

export default (_, inject) => {
  inject("getTopics", () => {
    return fixSvgPaths(topics);
  }),
    inject("isTopicDisabled", (topic) => {
      return isTopicDisabled(topic);
    });
  inject("isSubTopicDisabled", (subTopic) => {
    return isSubTopicDisabled(subTopic);
  });
  inject("getContentBySlug", (slug) => {
    return getContentBySlug(slug);
  });
};

function getContentBySlug(slug) {
  const slugParts = slug.toLowerCase().split("-");
  let content = null;
  
  // Try to match topic-subtopic combinations
  // First try the first part as topic, rest as subtopic
  if (slugParts.length >= 2) {
    const topicKey = slugParts[0];
    const subTopicKey = slugParts.slice(1).join("-"); // Join remaining parts with dashes
    
    const topic = topics[topicKey];
    if (topic != null) {
      const subTopic = topic.subTopics[subTopicKey];
      if (subTopic != null) {
        content = {
          ...subTopic,
          parentTopic: {
            slug: topicKey,
            heading: topic.heading,
            title: topic.title,
          },
        };
      }
    }
  }
  
  return content;
}

function isTopicDisabled(topic) {
  if (
    topic.title == null ||
    topic.heading == null ||
    topic.icon == null ||
    topic.subTopics == null
  ) {
    return true;
  } else {
    if (Object.keys(topic.subTopics).length < 1) {
      return true;
    } else {
      const subKey = Object.keys(topic.subTopics)[0];
      return isSubTopicDisabled(topic.subTopics[subKey]);
    }
  }
}

function isSubTopicDisabled(subTopic) {
  return (
    subTopic.title == null ||
    subTopic.heading == null ||
    subTopic.icon == null ||
    subTopic.dataFile == null ||
    subTopic.category == null ||
    subTopic.model == null
  );
}
