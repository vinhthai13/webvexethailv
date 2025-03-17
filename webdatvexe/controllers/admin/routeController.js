exports.create = async (req, res) => {
  try {
    const routeData = {
      from_location: req.body.from_location,
      to_location: req.body.to_location,
      distance: req.body.distance,
      duration: req.body.duration,
      description: req.body.description,
      price: req.body.price
    };
    // ... existing code ...
  }
}; 