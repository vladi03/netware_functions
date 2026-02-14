import {client} from "../elasticSearch/elasticConnect.js";
import {isFirestoreProd} from "../firestore/firestore.js";

export const fromElasticSearch = (data = {}) => {
  return Object.entries(data).reduce((acc, [fieldName, fieldValue]) => {
    // Skip undefined fields
    if (fieldValue === undefined || fieldValue === null) return acc;

    // Handle special Elasticsearch field transformations back to Firestore
    if (fieldName === 'uplinelistids') {
      return {
        ...acc,
        uplineList: fieldValue.map(id => ({ id }))
      };
    }

    if (fieldName === 'downlineids') {
      return {
        ...acc,
        downline: fieldValue.map(id => ({ id }))
      };
    }

    // Handle ISO date strings back to Firestore Timestamp format
    if (typeof fieldValue === 'string' && fieldValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      const date = new Date(fieldValue);
      return {
        ...acc,
        [fieldName]: Math.floor(date.getTime())
      };
    }

    // Handle coordinate strings back to GeoPoint format
    if (typeof fieldValue === 'string' && fieldValue.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
      const [latitude, longitude] = fieldValue.split(',').map(Number);
      return {
        ...acc,
        [fieldName]: {
          _latitude: latitude,
          _longitude: longitude
        }
      };
    }

    // Convert back from lowercase elasticsearch field names to camelCase Firestore names
    let firestoreFieldName = fieldName;
    
    // Handle common field name transformations
    const fieldMappings = {
      'display_name': 'displayName',
      'photo_url': 'photoUrl',
      'email_verified': 'emailVerified',
      'phone_number': 'phoneNumber',
      'created_time': 'createdTime',
      'last_sign_in_time': 'lastSignInTime',
      'rookie_rumble': 'rookieRumble'
    };

    if (fieldMappings[fieldName]) {
      firestoreFieldName = fieldMappings[fieldName];
    }

    // Add the processed field to the accumulated result
    return {
      ...acc,
      [firestoreFieldName]: fieldValue
    };
  }, {});
};

// Function to query users from Elasticsearch by user IDs
export const getUsersFromElasticsearch = async (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const indexName = isFirestoreProd() ? 'users-index' : 'users-dev-index';
  
  try {
    console.log(`Querying Elasticsearch index: ${indexName} with userIds:`, userIds);
    
    const response = await client.search({
      index: indexName,
      size: userIds.length, // Get all matching users
      body: {
        query: {
          terms: {
            '_id': userIds // Query by document IDs
          }
        }
      }
    });
    
    // Handle different response structures
    const hits = response.hits?.hits || response.body?.hits?.hits || [];
    
    if (!hits || hits.length === 0) {
      console.log('No users found in Elasticsearch for the provided user IDs');
      return [];
    }

    // Transform the results back to Firestore format
    const transformedUsers = hits.map(hit => ({
      id: hit._id,
      ...fromElasticSearch(hit._source)
    }));
    
    console.log(`Successfully transformed ${transformedUsers.length} users`);
    return transformedUsers;
  } catch (error) {
    console.error('Error querying users from Elasticsearch:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      meta: error.meta,
      body: error.body
    });
    throw error;
  }
};

// Function to get all users from Elasticsearch without organization filtering
// This is useful for testing and general user retrieval
export const getAllUsersFromElasticsearchUnfiltered = async (limit = 10000, excludeInternalTeam = true) => {
  const indexName =  'users-index';
  
  try {
    const internalOrganizationId = "2Bp8tTkw4LoWMy09t3Us";
    
    // Build query - exclude internal organization if requested
    const query = excludeInternalTeam ? {
      bool: {
        must_not: {
          term: {
            'organization.keyword': internalOrganizationId
          }
        }
      }
    } : {
      match_all: {}
    };
    
    const response = await client.search({
      index: indexName,
      size: limit,
      body: {
        query: query
      }
    });

    // Handle different response structures
    const hits = response.hits?.hits || response.body?.hits?.hits || [];
    
    if (!hits || hits.length === 0) {
      console.log('No users found in Elasticsearch');
      return [];
    }

    // Transform the results back to Firestore format
    const transformedUsers = hits.map(hit => ({
      id: hit._id,
      ...fromElasticSearch(hit._source)
    }));
    
    console.log(`Successfully transformed ${transformedUsers.length} users`);
    return transformedUsers;
  } catch (error) {
    console.error('Error querying users from Elasticsearch:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      meta: error.meta,
      body: error.body
    });
    throw error;
  }
};

