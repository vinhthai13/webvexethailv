class Route {
  constructor(data) {
    this.id = data.id;
    this.from_location = data.from_location;
    this.to_location = data.to_location; 
    this.distance = data.distance;
    this.duration = data.duration;
    this.description = data.description;
    this.price = data.price;
    this.image = data.image || null;
  }
  
  static async create(routeData) {
    const sql = `
      INSERT INTO routes (from_location, to_location, distance, duration, description, price, image) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      routeData.from_location,
      routeData.to_location,
      routeData.distance, 
      routeData.duration,
      routeData.description,
      routeData.price,
      routeData.image || null
    ];
    // ... existing code ...
  }
} 