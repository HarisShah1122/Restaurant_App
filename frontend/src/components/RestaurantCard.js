import React from 'react';

const RestaurantCard = ({ restaurant }) => {
  const images = restaurant.images?.slice(0, 2) || []; // Limit to 2 images

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">{restaurant.name || 'Unknown'}</h5>
        <p className="card-text"><strong>Cuisine:</strong> {restaurant.cuisine || 'N/A'}</p>
        <p className="card-text"><strong>Location:</strong> {restaurant.location || 'N/A'}</p>
        <p className="card-text"><strong>Rating:</strong> {restaurant.rating || 0} / 5</p>
        <p className="card-text"><strong>Description:</strong> {restaurant.description || 'N/A'}</p>
        <p className="card-text"><strong>Price Range:</strong> {restaurant.priceRange || 'N/A'}</p>
        <p className="card-text"><strong>Contact:</strong> {restaurant.contact || 'N/A'}</p>
        <p className="card-text"><strong>Opening Hours:</strong> {restaurant.openingHours || 'N/A'}</p>
        <p className="card-text"><strong>Menu:</strong> {restaurant.menu?.join(', ') || 'N/A'}</p>
        <div className="card-text">
          <strong>Reviews:</strong>
          <ul>
            {restaurant.reviews?.length > 0 ? (
              restaurant.reviews.map((review, index) => (
                <li key={index}>
                  {review.user}: {review.rating} / 5 - "{review.comment}"
                </li>
              ))
            ) : (
              <li>No reviews available</li>
            )}
          </ul>
        </div>
        <div className="d-flex flex-wrap">
          {images.length > 0 ? (
            images.map((image, index) => (
              <img
                key={index}
                src={`http://localhost:8081/${image}`}
                alt={`${restaurant.name || 'Restaurant'} ${index + 1}`}
                className="img-thumbnail m-1"
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                loading="lazy"
                onError={(e) => (e.target.src = '/images/placeholder.jpg')}
              />
            ))
          ) : (
            <p>No images available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RestaurantCard);