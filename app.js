import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'; // Adjust the path as necessary
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Now you can create a new instance of FontLoader
const loader = new FontLoader();

// Set up the scene
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
let model = null;
let isDragging = false;

// Set up OrbitControls
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Set up a basic grid helper (size: 10, divisions: 10)
let gridHelper = new THREE.GridHelper(50, 50);
scene.add(gridHelper);
const raycastPlane = new THREE.Plane(); // For raycasting

// Create a plane to use for raycasting (at y=0 plane)
let planeGeometry = new THREE.PlaneGeometry(100, 100);
let planeMaterial = new THREE.MeshBasicMaterial({ visible: false }); // invisible plane
let plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(-Math.PI / 2); // Rotate plane to lay flat on the y=0 axis
scene.add(plane);

// Set camera position
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);
const objectPaths = [
    { url: '/objects/00_Wood Pergola-4x6-Mordern-M0824.gltf', name: '00_Wood Pergola-4x6-Mordern-M0824', price: 12000, image: '/images/00_Wood Pergola-4x6-Mordern-M0824.png' },
    { url: '/objects/00_Wood Pergola-4x6-Mordern-M0724.gltf', name: '00_Wood Pergola-4x6-Mordern-M0724', price: 10000, image: '/images/00_Wood Pergola-4x6-Mordern-M0724.png' },
    { url: '/objects/00_Wood Pergola-4x6-Mordern-M0624.gltf', name: '00_Wood Pergola-4x6-Mordern-M0624', price: 10000, image: '/images/00_Wood Pergola-4x6-Mordern-M0624.png' },
    { url: '/objects/00_Aluminium Pergola-5x5-A2025.gltf', name: '00_Aluminium Pergola-5x5-A2025', price: 10000, image: '/images/00_Aluminium Pergola-5x5-A2025.png' },
    { url: '/objects/03_Grande Fountain-230x110.gltf', name: '03_Grande Fountain-230x110', price: 10000, image: '/images/03_Grande Fountain-230x110.png' },
    { url: '/objects/03_Flexy Fountain-150x140-Surface (Large).gltf', name: '03_Flexy Fountain-150x140-Surface (Large)', price: 10000, image: '/images/03_Flexy Fountain-150x140-Surface (Large).png' },
    { url: '/objects/03_Flexy Fountain-290x140-Sunken (Extra Large).gltf', name: '03_Flexy Fountain-290x140-Sunken (Extra Large)', price: 10000, image: '/images/03_Flexy Fountain-290x140-Sunken (Extra Large).png' },

];
let polygons = []; // Array to hold all polygons
let currentPolygon = {
    points: [],
    lines: [],
    closed: false,
    arrow: null,
    extrudedObject: null,
    tempLine: null,
    area: 0,
    texture: "",
};

let walls = []; //Array to hold all walls
let currentWall = {
    extrudedObject: null,
    area: 0,
    texture: "",
    points: [],
    length: 0,
    height: 0,
};

// Add a red sphere at a clicked position
function addPoint(x, y, z) {
    let geometry = new THREE.SphereGeometry(0.1, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    let sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    scene.add(sphere);
    currentPolygon.points.push(new THREE.Vector3(x, y, z));  // Store the point for the current polygon
}

// Add a line between two points
function addLine(start, end) {
    let material = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Blue lines by default
    let geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    let line = new THREE.Line(geometry, material);
    scene.add(line);
    currentPolygon.lines.push(line);  // Store the line for the current polygon
}



// objects section ----------------------------------------------------------------------------

// Global array to store loaded models
const loadedModels = [];
// Load the GLTF model
function loadModel(url, object) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
        model = gltf.scene;
        model.position.set(-30, 0.1, -30);

        scene.add(model);
        loadedModels.push({ ...object, model })
        calculateTotalPrice()
        console.log(loadedModels);
    });
}
// Open the modal and populate with object data
function openModal() {
    const objectGrid = document.getElementById("objectGrid");
    objectGrid.innerHTML = ""; // Clear existing content

    objectPaths.forEach((object) => {
        // Create container for each preview
        const previewContainer = document.createElement("div");
        previewContainer.classList.add("text-center");

        // Image element for each object
        const img = document.createElement("img");
        img.src = object.image;
        img.alt = object.name;
        img.style.width = "250px";
        img.style.height = "150px";
        img.classList.add("mb-2", "rounded", "cursor-pointer");

        // Object label
        const label = document.createElement("p");
        label.textContent = `${object.name} - $${object.price}`;

        // Event listener for loading model when clicking the image
        img.addEventListener("click", () => {

            loadModel(object.url, object)
            closeModal()

        });
        // Append image and label to container
        previewContainer.appendChild(img);
        previewContainer.appendChild(label);
        objectGrid.appendChild(previewContainer);
    });

    // Show modal
    document.getElementById("objectModal").classList.remove("hidden");
}

// Function to close modal and cleanup images
function closeModal() {
    document.getElementById('objectModal').classList.add('hidden');
    const objectGrid = document.getElementById("objectGrid");
    objectGrid.innerHTML = ""; // Clear all content
}



// end objects section --------------------------------------------------------------------------

//invoice section -------------------------------------------------------------------------------
// Open the Invoice Modal and populate data
function openInvoiceModal() {
    const invoiceBody = document.getElementById("invoiceBody");
    invoiceBody.innerHTML = ""; // Clear existing content

    const date = new Date().toLocaleDateString();
    document.getElementById("invoiceDate").textContent = date;

    // Calculate quantities and prices
    const itemMap = new Map();
    loadedModels.forEach(({ name, price }) => {
        if (!itemMap.has(name)) {
            itemMap.set(name, { name, price, quantity: 1 });
        } else {
            itemMap.get(name).quantity += 1;
        }
    });

    let totalInvoicePrice = 0;

    // Populate table with combined items
    itemMap.forEach(item => {
        const row = document.createElement("tr");
        row.classList.add("text-center");

        // Calculate total price for each item
        const itemTotalPrice = item.price * item.quantity;
        totalInvoicePrice += itemTotalPrice;

        row.innerHTML = `
            <td class="p-2 border">${item.name}</td>
            <td class="p-2 border">${item.price} AED</td>
            <td class="p-2 border">${item.quantity}</td>
            <td class="p-2 border">${itemTotalPrice.toFixed(2)} AED</td>
        `;
        invoiceBody.appendChild(row);
    });

    // Get floor information from polygons array
    const floorTableBody = document.getElementById("floorTableBody");
    floorTableBody.innerHTML = ""; // Clear existing content
    const pricePerSquareMeter = 80;

    polygons.forEach(polygon => {
        if (polygon.extrudedObject && polygon.area > 0) {
            const floorTotalPrice = polygon.area * pricePerSquareMeter;
            totalInvoicePrice += floorTotalPrice;

            const row = document.createElement("tr");
            row.classList.add("text-center");

            row.innerHTML = `
                <td class="p-2 border">${polygon.extrudedObject.uuid}</td>
                <td class="p-2 border">${polygon.texture}</td>
                <td class="p-2 border">${polygon.area.toFixed(2)} m²</td>
                <td class="p-2 border">${pricePerSquareMeter} AED/m²</td>
                <td class="p-2 border">${floorTotalPrice.toFixed(2)} AED</td>
            `;
            floorTableBody.appendChild(row);
        }
    });
    // Get wall information from walls array
    const wallTableBody = document.getElementById("wallTableBody");
    wallTableBody.innerHTML = ""; // Clear existing content

    walls.forEach(wall => {
        if (wall.extrudedObject && wall.area > 0) {
            const wallTotalPrice = wall.area * pricePerSquareMeter;
            totalInvoicePrice += wallTotalPrice;

            const row = document.createElement("tr");
            row.classList.add("text-center");

            row.innerHTML = `
                <td class="p-2 border">${wall.extrudedObject.uuid}</td>
                <td class="p-2 border">${wall.texture}</td>
                <td class="p-2 border">${wall.length.toFixed(2)} m</td>
                <td class="p-2 border">${wall.height.toFixed(2)} m</td>
                <td class="p-2 border">${wall.area.toFixed(2)} m²</td>
                <td class="p-2 border">${pricePerSquareMeter} AED/m²</td>
                <td class="p-2 border">${wallTotalPrice.toFixed(2)} AED</td>
            `;
            wallTableBody.appendChild(row);
        }
    });
    document.getElementById("invoiceDate").textContent = new Date().toLocaleDateString();
    document.getElementById("totalPrice").textContent = totalInvoicePrice.toFixed(2);
    document.getElementById("totalCost").textContent = totalInvoicePrice.toFixed(2);
    document.getElementById("invoiceModal").classList.remove("hidden");
}

// Close the Invoice Modal
document.getElementById("closeInvoiceModal").addEventListener("click", () => {
    document.getElementById("invoiceModal").classList.add("hidden");
});

// open the Invoice Modal
document.getElementById("poqBtn").addEventListener("click", () => {
    openInvoiceModal()
});

function printInvoice() {
    // Save the original body content
    const originalContents = document.body.innerHTML;

    // Get the content of the invoice modal
    const printContents = document.getElementById("invoiceModal").innerHTML;

    // Replace the body content with the invoice content
    document.body.innerHTML = printContents;

    // Add a print style to keep the background
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            body {
                -webkit-print-color-adjust: exact; /* For Chrome */
                print-color-adjust: exact; /* For Firefox */
            }
            /* Hide buttons or any specific elements during printing */
            button, .no-print {
                display: none !important;
            }
            /* Hide default headers and footers */
            @page {
                margin: 0; /* Remove default margins */
            }
            h1, h2, h3, h4, h5, h6, p, span {
                page-break-inside: avoid; /* Prevent page breaks inside elements */
            }
        }
    `;
    document.head.appendChild(style);

    // Print the content
    window.print();

    // Restore the original content
    document.body.innerHTML = originalContents;
}


// print the Invoice Modal
document.getElementById("printInvoice").addEventListener("click", () => {
    printInvoice()
    // Ensure page reloads properly after printing
    window.onafterprint = () => location.reload();
});



//end invoice section ---------------------------------------------------------------------------





//mesaure destance section -----------------------------------------------------------------------
const measureButton = document.getElementById("measureButton");
const measurementContainer = document.getElementById("measurementContainer");

let isMeasuring = false;
let points = [];

// Toggle measure mode on button click
measureButton.addEventListener("click", () => {
    isMeasuring = !isMeasuring; // Toggle measurement mode
    points = []; // Clear previous points
    document.body.style.cursor = isMeasuring ? 'crosshair' : 'default'; // Change cursor
    measurementContainer.classList.toggle("active", isMeasuring);
    console.log(isMeasuring ? "Measurement mode activated." : "Measurement mode deactivated.");
});

// Click handler for capturing points and calculating distance
measurementContainer.addEventListener("click", (event) => {
    if (!isMeasuring) return;

    console.log("Click event triggered inside measurement container."); // Debug line

    // Record clicked point relative to the container
    const rect = measurementContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    points.push({ x, y });

    console.log(`Point ${points.length} recorded at (${x}, ${y})`);

    if (points.length === 2) {
        // Calculate distance and draw line
        const distance = calculateDistance(points[0], points[1]);
        drawLineWithDistance(points[0], points[1], distance);
        points = []; // Reset points for next measurement
        isMeasuring = false;
        document.body.style.cursor = 'default'; // Reset cursor to default
        measurementContainer.classList.remove("active"); // Deactivate measurement container
        console.log(`Distance: ${distance} m`);
    }
});



// Function to draw the line and display distance label
// Function to draw the line and display distance label
function drawLineWithDistance(point1, point2, distance) {
    // Create line element (as before)
    const line = document.createElement("div");
    line.classList.add("measurement-line");

    // Position and rotate the line
    const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
    const length = calculateDistanceInPixels(point1, point2);
    line.style.width = `${length}px`;
    line.style.transform = `translate(${point1.x}px, ${point1.y}px) rotate(${angle}rad)`;

    // Create a texture for the distance label
    const texture = createTextTexture(`${distance.toFixed(2)} m`); // Ensure distance is a number here

    // Create a plane geometry for the label
    const planeGeometry = new THREE.PlaneGeometry(2, 1); // Adjust width and height as needed
    const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const lengthLabel = new THREE.Mesh(planeGeometry, planeMaterial);

    // Position label at the midpoint of the line
    lengthLabel.position.set(
        point1.x ,
        point1.y,
        point1.z
    );
    lengthLabel.position.y += 0.1; // Adjust height for visibility

    // Add line and label to the scene
    measurementContainer.appendChild(line);
    scene.add(lengthLabel); // Add the label mesh to the Three.js scene

    console.log("Line and label added to DOM.");

}




// Function to calculate distance in pixels for line length
function calculateDistanceInPixels(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}
// Function to calculate the distance between two points
function calculateDistance(point1, point2) {

    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy) / 100; // Convert pixels to meters (approx.)
}
// Function to calculate distance in 3D space
function calculate3DDistance(point1, point2) {
    console.log("point 1: ", point1)
    return point1.distanceTo(point2); // Returns distance in the same units as the scene (e.g., meters)
}

// Function to convert screen coordinates to 3D world coordinates
function screenToWorld(x, y, camera) {
    const vector = new THREE.Vector3();
    vector.set(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1,
        0.5
    );

    // Unproject the screen position into the world position
    vector.unproject(camera);
    return vector;
}
//end measuare destance section ------------------------------------------------------------------





// Get mouse position helper
function getMousePosition1(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    return mouse;
}

// Handle pointer down (start drag)
function onPointerDown(event) {
    if (isMeasuring) return;
    event.preventDefault();
    if (!model) {
        console.warn('Model is not loaded yet.'); // Log if model is not loaded
        return; // Exit the function if the model is not loaded
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(getMousePosition1(event), camera);

    // Check for intersection with the model
    const intersects = raycaster.intersectObject(model, true); // true for recursive check
    if (intersects.length > 0) {
        isDragging = true;

        // Set up raycast plane
        const normal = new THREE.Vector3(0, 1, 0); // Upwards Y direction
        const pointOnPlane = intersects[0].point; // Use the intersection point
        raycastPlane.setFromNormalAndCoplanarPoint(normal, pointOnPlane);

        // Disable orbit controls while dragging
        controls.enableRotate = false; // Disable rotation
    }
}

// Handle pointer up (end drag)
function onPointerUp() {
    isDragging = false;
    controls.enableRotate = true; // Re-enable rotation
}

// Handle pointer move (dragging)
function onPointerMove(event) {
    if (!isDragging || !model) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(getMousePosition1(event), camera);
    const intersection = new THREE.Vector3();

    // Update intersection with raycastPlane
    if (raycaster.ray.intersectPlane(raycastPlane, intersection)) {
        const newX = intersection.x;
        const newZ = intersection.z;

        // Update model position
        model.position.set(newX, model.position.y, newZ); // Keep the original Y position of the model
    }
}

// Add event listeners to handle pointer interactions
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('pointermove', onPointerMove);

// Change the color of all lines to blue when the polygon is closed
function changePolygonColor() {
    for (let line of currentPolygon.lines) {
        line.material.color.set(0x0000ff); // Change line color to blue
    }
}

// Check if the user clicked near the first point
function isNearFirstPoint(point) {
    if (currentPolygon.points.length === 0) return false;
    let startPoint = currentPolygon.points[0];
    return point.distanceTo(startPoint) < 0.2;  // Adjust threshold as needed
}

// Add an arrow on top of the polygon's centroid after closing it
function addArrowHelper() {
    // Calculate centroid of the polygon
    let centroid = new THREE.Vector3();
    currentPolygon.points.forEach((point) => centroid.add(point));
    centroid.divideScalar(currentPolygon.points.length);

    // Create an arrow pointing upwards
    let direction = new THREE.Vector3(0, 1, 0); // Upwards direction
    let length = 1;
    let color = 0x00ff00; // Green color for the arrow
    currentPolygon.arrow = new THREE.ArrowHelper(direction, centroid, length, color);
    scene.add(currentPolygon.arrow);
}

function calculatePolygonArea(points) {
    let area = 0;
    // Using the Shoelace formula
    const numPoints = points.length;
    for (let i = 0; i < numPoints; i++) {
        const x1 = points[i].x;
        const z1 = points[i].z;
        const x2 = points[(i + 1) % numPoints].x; // Wrap around to the first point
        const z2 = points[(i + 1) % numPoints].z;

        area += (x1 * z2 - x2 * z1);
    }

    area = Math.abs(area) / 2; // Final area
    return area; // Returns area in square units
}





function extrudePolygon() {
    if (currentPolygon.closed) {
        // Create a shape from the current polygon's points
        const shape = new THREE.Shape();
        shape.moveTo(currentPolygon.points[0].x, currentPolygon.points[0].z); // Start at the first point

        for (let i = 1; i < currentPolygon.points.length; i++) {
            shape.lineTo(currentPolygon.points[i].x, currentPolygon.points[i].z); // Draw lines to each point
        }

        shape.lineTo(currentPolygon.points[0].x, currentPolygon.points[0].z); // Close the shape

        // Create extrude settings
        const extrudeSettings = {
            depth: 0.1, // Extrude depth
            bevelEnabled: false, // No bevel for simplicity
            curveSegments: 12 // More segments for smoother curves
        };

        // Create the extruded geometry
        const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Load the texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(`./public/images/pavers/${floorChosenTexture}`, function (texture) {
            // Set texture wrapping and repeat
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1); // Adjust repeat values as needed

            // Create a material with the loaded texture
            const textureMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                emissive: 0x000000, // Start with no emissive color
                side: THREE.DoubleSide // If you want to see both sides of the polygon
            });

            // Create the mesh with the extruded geometry and textured material
            currentPolygon.extrudedObject = new THREE.Mesh(extrudeGeometry, textureMaterial);

            // Position the extruded object correctly
            currentPolygon.extrudedObject.rotation.x = Math.PI / 2; // Rotate it to make the top face upwards
            currentPolygon.extrudedObject.position.set(0, 0.1, 0); // Center it and move it up above the plane
            scene.add(currentPolygon.extrudedObject); // Add extruded object to the scene
            // Calculate the area of the extruded object
            currentPolygon.area = calculatePolygonArea(currentPolygon.points)
            let textureName = floorChosenTexture.slice(0, -4);
            currentPolygon.texture = textureName;
            polygons.push(currentPolygon)
            calculateTotalPrice()
            // Reset the currentPolygon object
            currentPolygon = {
                points: [],
                lines: [],
                closed: false,
                arrow: null,
                extrudedObject: null,
                tempLine: null,
                area: 0,
            };
            console.log(polygons)
            // Remove the arrow after extrusion
            scene.remove(currentPolygon.arrow);
            isDrawing = false;
            document.body.classList.remove("draw-cursor"); // Reset the cursor
        });
    }
}
// function isPointInPolygon(point) {
//     if (!currentPolygon.closed) return false; // Only check if polygon is closed

//     // Create a shape from the points
//     const shape = new THREE.Shape();
//     shape.moveTo(currentPolygon.points[0].x, currentPolygon.points[0].z); // Start at the first point

//     for (let i = 1; i < currentPolygon.points.length; i++) {
//         shape.lineTo(currentPolygon.points[i].x, currentPolygon.points[i].z); // Draw lines to each point
//     }

//     shape.lineTo(currentPolygon.points[0].x, currentPolygon.points[0].z); // Close the shape

//     // Create a Path from the shape
//     const path = new THREE.Path();
//     path.fromPoints(shape.getPoints());

//     // Use the containsPoint method of the Path
//     return path.contains(point.x, point.z);
// }
function isPointInPolygon(point) {
    if (!currentPolygon.closed) return false; // Only check if polygon is closed

    // Extract x and z coordinates from currentPolygon points
    const vertices = currentPolygon.points.map(p => new THREE.Vector2(p.x, p.z));

    // Check if the point is within the polygon
    return THREE.ShapeUtils.isPointInPolygon(new THREE.Vector2(point.x, point.z), vertices);
}
// Initialize drawing state
let isDrawing = false;
// Button to toggle drawing mode
const toggleDrawButton = document.getElementById('toggleDrawButton');
toggleDrawButton.addEventListener('click', () => {
    showTextureModalPavers();
});


let wallBasePoints = [];
let wallDrawingMode = false;
let tempLine = null; // For temporary line
let tempPoints = []; // For holding points temporarily
let wallHeight = 0;

// Ensure canvas is selected correctly
const canvas = document.querySelector('canvas');

// Helper to add a point in the scene at the clicked position
function drawPoint(x, z) {
    const pointGeometry = new THREE.SphereGeometry(0.05, 32, 32); // Small sphere for the point
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red point
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.set(x, 0, z); // Add point to ground level (y = 0)
    scene.add(point);
}

// Helper to draw a temporary line
function drawTempLine(start, end) {
    if (tempLine) {
        scene.remove(tempLine); // Remove the previous temp line
    }

    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start.x, 0, start.z),
        new THREE.Vector3(end.x, 0, end.z),
    ]);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Green temporary line

    tempLine = new THREE.Line(geometry, material);
    scene.add(tempLine); // Add temporary line to the scene
}


// Draw final wall after 2 points and height entered
function drawWall(points, height) {
    currentWall.points = points;
    currentWall.height = height;
    const [start, end] = points;

    // Calculate the wall length (distance between points)
    const wallLength = start.distanceTo(end);
    currentWall.length = wallLength;

    // Define the shape of the wall (2D profile)
    const wallShape = new THREE.Shape();
    wallShape.moveTo(-wallLength / 2, 0); // Bottom left (centered at origin)
    wallShape.lineTo(-wallLength / 2, height); // Top left
    wallShape.lineTo(wallLength / 2, height); // Top right
    wallShape.lineTo(wallLength / 2, 0); // Bottom right
    wallShape.lineTo(-wallLength / 2, 0); // Close the shape

    const extrudeSettings = {
        steps: 1,
        depth: 0.1, // Wall thickness
        bevelEnabled: false,
    };

    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load(`./public/images/walls/${wallChosenTexture}`, (texture) => {
        texture.wrapS = THREE.RepeatWrapping; // Allow repeating the texture horizontally
        texture.wrapT = THREE.RepeatWrapping; // Allow repeating the texture vertically
        texture.repeat.set(4, 1); // Adjust texture scaling (4 repeats along length, 1 along height)
    });

    // Create the wall geometry and material
    const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);

    const material = new THREE.MeshStandardMaterial({
        map: wallTexture,
        side: THREE.DoubleSide,
    });

    const wall = new THREE.Mesh(geometry, material);

    // Calculate the midpoint between start and end points
    const midPoint = new THREE.Vector3(
        (start.x + end.x) / 2,
        0,
        (start.z + end.z) / 2
    );

    // Set the position of the wall to the midpoint
    wall.position.copy(midPoint);

    // Align the wall to face the direction from start to end
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const angle = Math.atan2(direction.z, direction.x); // Y-axis rotation
    wall.rotation.y = -angle; // Apply rotation to align with the two points

    // Add the wall to the scene
    currentWall.extrudedObject = wall;
    currentWall.area = wallLength * height;
    let textureName = wallChosenTexture.slice(0, -4);
    currentWall.texture = textureName;
    scene.add(wall);
    walls.push(currentWall);
    calculateTotalPrice()
    console.log(walls)
    wallDrawingMode = false;
    currentWall = {
        points: [],
        height: 0,
        length: 0,
        extrudedObject: null,
        texture: "",
        area: 0,
    };
}


function calculateTotalPrice() {
    const itemMap = new Map();
    loadedModels.forEach(({ name, price }) => {
        if (!itemMap.has(name)) {
            itemMap.set(name, { name, price, quantity: 1 });
        } else {
            itemMap.get(name).quantity += 1;
        }
    });

    let totalInvoicePrice = 0;

    // Populate table with combined items
    itemMap.forEach(item => {
        // Calculate total price for each item
        const itemTotalPrice = item.price * item.quantity;
        totalInvoicePrice += itemTotalPrice;
    });

    // Get floor information from polygons array
    const pricePerSquareMeter = 80;

    polygons.forEach(polygon => {
        if (polygon.extrudedObject && polygon.area > 0) {
            const floorTotalPrice = polygon.area * pricePerSquareMeter;
            totalInvoicePrice += floorTotalPrice;
        }
    });
    // Get wall information from walls array
    walls.forEach(wall => {
        if (wall.extrudedObject && wall.area > 0) {
            const wallTotalPrice = wall.area * pricePerSquareMeter;
            totalInvoicePrice += wallTotalPrice;
        }
    });
    document.getElementById("totalCost").textContent = totalInvoicePrice.toFixed(2);
}


// Helper function to reset wall drawing process
function resetWallDrawing() {
    wallBasePoints = [];
    tempPoints = [];
    if (tempLine) {
        scene.remove(tempLine);
        tempLine = null;
    }
}

// Function to get mouse position in the scene
function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    const mouse = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };

    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera); // Assuming `camera` is your Three.js camera
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.y / dir.y; // Assuming ground plane is at y=0
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    return { x: pos.x, z: pos.z };
}

// Function to handle mouse clicks
function onMouseClick(event) {

    if (isMeasuring) {
        console.log("Click event triggered inside measurement container.");
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        let mouse1 = new THREE.Vector2();
        mouse1.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse1.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycaster to project mouse position into the 3D world
        let raycaster1 = new THREE.Raycaster();
        raycaster1.setFromCamera(mouse1, camera);

        // Intersect with the invisible plane (instead of grid directly)
         let intersects1 = raycaster1.intersectObject(plane);
         let point;
        if (intersects1.length > 0) {
             point = intersects1[0].point;
        }
            points.push(point);

          

            if (points.length === 3) {
                // Calculate distance between the two 3D points
                const distance = calculate3DDistance(points[1], points[2]);
                drawLineWithDistance(points[1], points[2], distance); // Function to draw line in 3D

                points = []; // Reset points for next measurement
                isMeasuring = false;
                document.body.style.cursor = 'default';
                measurementContainer.classList.remove("active");
                alert(`Distance: ${distance.toFixed(2)} meters`);
                animate();
            }
            return;
        }


        if (wallDrawingMode && wallBasePoints.length < 3) {
            const point = getMousePosition(event);
            const vectorPoint = new THREE.Vector3(point.x, 0, point.z); // Create a THREE.Vector3 point

            // Draw the point at the clicked position
            if (wallBasePoints.length > 1) {
                drawPoint(vectorPoint);

            }
            wallBasePoints.push(vectorPoint); // Store the clicked point

            // If two points have been clicked, prompt for wall height and draw the wall
            if (wallBasePoints.length === 3) {
                const heightInput = prompt("Enter the wall height:", "2.5"); // Prompt for height
                wallHeight = parseFloat(heightInput);

                // Validate the height input
                if (isNaN(wallHeight) || wallHeight <= 0) {
                    alert("Please enter a valid height.");
                    resetWallDrawing(); // Reset the drawing if the input is invalid
                } else {
                    wallBasePoints.shift();
                    drawWall(wallBasePoints, wallHeight); // Draw the wall
                    wallDrawingMode = false; // Disable drawing mode after drawing
                    document.body.classList.remove("draw-cursor"); // Reset the cursor
                    wallBasePoints = []; // Clear points for future walls
                }
            }
        }

        if (!isDrawing) return; // Ignore clicks if not in drawing mode

        if (currentPolygon.closed) {
            // Raycaster to detect clicks on the arrow
            let mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            let intersects = raycaster.intersectObject(currentPolygon.arrow, true);

            if (intersects.length > 0) {

                extrudePolygon();
                return;
            }
        }
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        let mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycaster to project mouse position into the 3D world
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        // Intersect with the invisible plane (instead of grid directly)
        let intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
            let point = intersects[0].point;

            // Check if the user clicked inside the closed polygon
            if (currentPolygon.closed && isPointInPolygon(point)) {
                console.log('Click ignored: Point is inside the closed polygon.');
                return; // Ignore the click
            }

            // Check if we are near the first point to close the path
            if (isNearFirstPoint(point) && currentPolygon.points.length > 1) {
                addLine(currentPolygon.points[currentPolygon.points.length - 1], currentPolygon.points[0]); // Close the polygon
                currentPolygon.closed = true;
                changePolygonColor(); // Change the color of the closed polygon
                addArrowHelper(); // Add the extrusion arrow


                // Remove the temporary line
                if (currentPolygon.tempLine) {
                    scene.remove(currentPolygon.tempLine);
                    currentPolygon.tempLine = null;
                }
                return;
            }

            // Add a new point and a line connecting the previous point
            addPoint(point.x, point.y, point.z);
            if (currentPolygon.points.length > 1) {
                addLine(currentPolygon.points[currentPolygon.points.length - 2], currentPolygon.points[currentPolygon.points.length - 1]);
            }
        }
    }

    function createTextTexture(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Set the font size and style
        context.font = '24px Arial';
        const textWidth = context.measureText(text).width;

        // Set canvas size based on text width
        canvas.width = textWidth;
        canvas.height = 30; // Set the height of the canvas

        // Draw the text on the canvas
        context.fillStyle = 'transparent'; // Background color
        context.fillRect(0, 0, canvas.width, canvas.height); // Background rectangle
        context.fillStyle = 'white'; // Text color
        context.fillText(text, 0, 20); // Draw the text

        // Create a texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    const distance = 5; // Example distance value
    const texture = createTextTexture(`${distance.toFixed(2)} m`);

    const planeGeometry1 = new THREE.PlaneGeometry(2, 1); // Width and height of the plane
    const planeMaterial1 = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    let lengthLabel = new THREE.Mesh(planeGeometry1, planeMaterial1);

    // Position the label above the intersection point
    lengthLabel.position.y += 0.1; // Adjust height for visibility
    // Function to handle mouse movement
    function onMouseMove(event) {
        if (wallDrawingMode && wallBasePoints.length === 2) {
            const point = getMousePosition(event); // Get current mouse position
            drawTempLine(wallBasePoints[1], point); // Draw a temporary line from the first point to the current mouse position
            return;
        }
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        // Update the raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(plane);

        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;

            // Calculate distance and create/update label
            if (currentPolygon.tempLine) {
                const lastPoint = currentPolygon.points[currentPolygon.points.length - 1];
                console.log("lastpoint: ", lastPoint)
                const distance = lastPoint.distanceTo(intersectionPoint);
                const texture = createTextTexture(`${distance.toFixed(2)} m`);
                scene.remove(lengthLabel)
                const planeMaterial1 = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
                lengthLabel = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), planeMaterial1);
                lengthLabel.position.copy(intersectionPoint);
                lengthLabel.position.y += 0.1; // Adjust height for visibility
                scene.add(lengthLabel);
            }

            // Update the temporary line position
            if (currentPolygon.tempLine) {
                currentPolygon.tempLine.geometry.setFromPoints([currentPolygon.points[currentPolygon.points.length - 1], intersectionPoint]);
            } else if (currentPolygon.points.length > 0) {
                const lineMaterial1 = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color for feedback line
                const lineGeometry1 = new THREE.BufferGeometry().setFromPoints([currentPolygon.points[currentPolygon.points.length - 1], intersectionPoint]);
                currentPolygon.tempLine = new THREE.Line(lineGeometry1, lineMaterial1);
                scene.add(currentPolygon.tempLine); // Add the temporary line to the scene
            }
        }

        // Remove the temporary line if the current polygon is closed
        if (currentPolygon.closed) {
            if (currentPolygon.tempLine) {
                scene.remove(currentPolygon.tempLine);
                currentPolygon.tempLine = null;
            }
        }
    }

    // Function to handle mouse up event
    function onMouseUp(event) {
        // Check if the path should be closed
        if (currentPolygon.tempLine) {
            scene.remove(currentPolygon.tempLine); // Remove the temporary line
            currentPolygon.tempLine = null; // Reset temporary line
        }
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    scene.add(ambientLight);

    // Add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    let wallChosenTexture = "";
    // Add event listeners for mouse actions
    window.addEventListener('click', onMouseClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let selectedObject = null; // To keep track of the currently selected object
    let isMoving = false; // Flag to indicate if an object is currently being moved

    // Detect double-clicks to select an object

    window.addEventListener('dblclick', function (event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        let mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        // Check the polygons array for valid extrudedObjects
        const validPolygons = polygons.filter(p => p.extrudedObject !== null);

        // Intersect only meshes or specific objects
        let intersects = raycaster.intersectObjects(validPolygons.map(p => p.extrudedObject), true);

        if (intersects.length > 0) {
            selectedObject = intersects[0].object; // Store the selected object
            console.log('Selected Object:', selectedObject);
            isMoving = true; // Start moving the object
        }
    });
    // Activate wall drawing mode
    document.getElementById('add-wall-btn').addEventListener('click', () => {
        showTextureModal()
        document.body.classList.add("draw-cursor"); // Apply the cursor
        wallBasePoints = []; // Clear previous points
        resetWallDrawing(); // Clear any temporary drawings
    });
    // Apply the selected texture to the object
    function applyTexture(texture) {
        wallChosenTexture = texture;
        console.log(wallChosenTexture)
        const loader = new THREE.TextureLoader();
        loader.load(`./public/images/walls/${texture}`, (loadedTexture) => {
            loadedTexture.wrapS = THREE.RepeatWrapping;
            loadedTexture.wrapT = THREE.RepeatWrapping;
            loadedTexture.repeat.set(1, 1);
            selectedObject.material.map = loadedTexture;
            selectedObject.material.needsUpdate = true;

        });
        wallDrawingMode = true; // Enable wall drawing mode
        document.getElementById('textureModal').classList.add('hidden'); // Close the modal
    }

    function applyTexturePavers(texture) {
        floorChosenTexture = texture;
        const loader = new THREE.TextureLoader();
        loader.load(`./public/images/pavers/${texture}`, (loadedTexture) => {
            loadedTexture.wrapS = THREE.RepeatWrapping;
            loadedTexture.wrapT = THREE.RepeatWrapping;
            loadedTexture.repeat.set(1, 1);
            selectedObject.material.map = loadedTexture;
            selectedObject.material.needsUpdate = true;

        });

        document.getElementById('textureModalPavers').classList.add('hidden'); // Close the modal
        setTimeout(() => {
            isDrawing = true;
            document.body.classList.add("draw-cursor"); // Apply the cursor
        }, 100); // Adjust delay time as needed (100ms should be enough)


    }

    function showTextureModal() {
        const modal = document.getElementById('textureModal');
        modal.classList.remove('hidden');
        const textureList = document.getElementById('textureList');
        textureList.innerHTML = ''; // Clear previous textures

        // Load available textures from the public/images folder
        const textures = ['Wall-Decado-Dune_BaseColor.png', 'Wall-Decado-Hazel_BaseColor.png', 'Wall-Decado-Iris_BaseColor.png', 'Wall-Decado-Nebula_BaseColor.png', 'Wall-Decado-RoastBrown_BaseColor.png']; // Add your texture file names here

        textures.forEach((texture) => {
            const img = document.createElement('img');
            img.src = `./public/images/${texture}`;
            img.classList.add('cursor-pointer', 'border', 'rounded', 'w-40', 'h-20');
            img.addEventListener('click', () => applyTexture(texture));
            textureList.appendChild(img);
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            modal.classList.add('hidden'); // Close the modal
        });
    }
    let floorChosenTexture = "";
    function showTextureModalPavers() {
        const modal = document.getElementById('textureModalPavers');
        modal.classList.remove('hidden');
        const textureList = document.getElementById('textureListPavers');
        textureList.innerHTML = ''; // Clear previous textures

        // Load available textures from the public/images folder
        const textures = ['PebblesBlack_BaseColor.png', 'TerentoHazel_BaseColor.png', 'TerentoSlate_BaseColor.png', 'VillagioSlate_BaseColor.png', 'VillagioTerra_BaseColor.png']; // Add your texture file names here

        textures.forEach((texture) => {
            const img = document.createElement('img');
            img.src = `./public/images/pavers/${texture}`;
            img.classList.add('cursor-pointer', 'border', 'rounded', 'w-40', 'h-20');
            img.addEventListener('click', () => applyTexturePavers(texture));
            textureList.appendChild(img);
        });

        document.getElementById('closeModalPavers').addEventListener('click', () => {
            modal.classList.add('hidden'); // Close the modal
        });
    }


    // Handle right-click on any 3D object
    function onRightClick(event) {
        event.preventDefault();

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const validPolygons = polygons.filter(p => p.extrudedObject !== null);
        let intersects = raycaster.intersectObjects(validPolygons.map(p => p.extrudedObject), true);
        if (intersects.length === 0) {
            // If no intersections found in validPolygons, check all children of the scene
            intersects = raycaster.intersectObjects(scene.children, true);
        }
        console.log(intersects)
        if (intersects.length > 0 && intersects.length < 5) {
            selectedObject = intersects[0].object; // Store the clicked object
            showTextureModal(); // Display the texture selection modal
        }
    }
    window.addEventListener('contextmenu', (event) => {
        event.preventDefault(); // Prevent the default context menu from showing
        onRightClick(event); // Call your function to handle right-click
    });

    // JavaScript to handle color switching
    let isLightMode = false; // Track the current mode (false = dark mode)

    document.getElementById("toggleColorButton").addEventListener("click", function () {

        if (!isLightMode) {
            scene.background = new THREE.Color(0xffffff); // Sets the background color to white
            this.querySelector('i').classList.remove('text-yellow-100'); // Remove dark mode color
            this.querySelector('i').classList.add('text-yellow-400'); // Add light mode color
        } else {
            scene.background = new THREE.Color(0x000000); // Sets the background color to white
            this.querySelector('i').classList.remove('text-yellow-400'); // Remove light mode color
            this.querySelector('i').classList.add('text-yellow-100'); // Add dark mode color
        }
        isLightMode = !isLightMode; // Toggle the mode
    });


    // State to track the visibility of the grid
    let isGridVisible = true;

    // Function to toggle the grid visibility
    document.getElementById("toggleGridButton").addEventListener("click", function () {
        isGridVisible = !isGridVisible; // Toggle the state
        gridHelper.visible = isGridVisible; // Set grid visibility
        this.querySelector('i').classList.toggle('text-gray-500', !isGridVisible); // Change icon color based on visibility
        this.querySelector('i').classList.toggle('text-white', isGridVisible); // Change icon color based on visibility
    });

    // Assuming you have these two flags to control the views
    let is2D = false;

    // Function to switch to 2D view
    function switchTo2D() {
        is2D = true;
        // Adjust your camera and scene settings for 2D
        camera.position.set(0, 10, 0); // Adjust the camera position for a top-down view
        camera.rotation.set(-Math.PI / 2, 0, 0); // Point the camera downwards
        controls.enableRotate = false; // Disable rotation for 2D
        controls.enableZoom = false; // Optionally disable zoom
        controls.update(); // Update controls
        animate();
    }

    // Function to switch to 3D view
    function switchTo3D() {
        is2D = false;
        // Reset camera settings for 3D view
        camera.position.set(0, 5, 10); // Adjust to your desired 3D position
        camera.rotation.set(0, 0, 0); // Reset rotation
        controls.enableRotate = true; // Enable rotation for 3D
        controls.enableZoom = true; // Optionally enable zoom
        controls.update(); // Update controls
        animate();
    }

    // Add event listeners to the buttons
    document.getElementById("switchTo2D").addEventListener("click", switchTo2D);
    document.getElementById("switchTo3D").addEventListener("click", switchTo3D);
    // Function to handle keyboard input for moving the selected object
    function onKeyDown(event) {
        if (!selectedObject) return; // Only move if an object is selected
        if (!isMoving) return; // Only move if currently in the moving state

        const step = 0.1; // Define how much to move on each key press

        switch (event.key) {
            case 'ArrowUp': // Move up (Z-axis)
                selectedObject.position.z -= step; // Move along the Z-axis
                break;
            case 'ArrowDown': // Move down (Z-axis)
                selectedObject.position.z += step; // Move along the Z-axis
                break;
            case 'ArrowLeft': // Move left (X-axis)
                selectedObject.position.x -= step; // Move along the X-axis
                break;
            case 'ArrowRight': // Move right (X-axis)
                selectedObject.position.x += step; // Move along the X-axis
                break;
            case 'e': // End moving operation
            case 'E':
                isMoving = false; // Stop moving the object
                console.log('Movement ended');
                break;
        }

        // Ensure that the position is logged for debugging
        console.log('Object Position:', selectedObject.position);
    }

    // Add event listener for keydown
    window.addEventListener('keydown', onKeyDown);
    // Handle the button click
    document.getElementById('addObjectBtn').addEventListener('click', () => {
        openModal();
        console.log('Object added to the scene');
    });
    // Handle the button click
    document.getElementById('closeObjectModal').addEventListener('click', () => {
        closeModal();

    });
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
