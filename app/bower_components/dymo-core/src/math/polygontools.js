function PolygonTools() { }

PolygonTools.isPointInPolygon = function(poly, pt) {
	for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
		((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1] < poly[i][1]))
		&& (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
		&& (c = !c);
	}
	return c;
}

PolygonTools.getArea = function(polygon) {
	var area = 0, point1, point2;
	for (var i = 0, j = polygon.length - 1; i < polygon.length; j=i,i++) {
		point1 = polygon[i];
		point2 = polygon[j];
		area += point1[0] * point2[1];
		area -= point1[1] * point2[0];
	}
	area /= 2;
	return area;
};

PolygonTools.getCentroid = function(polygon) {
	var point1, point2, f, x = 0, y = 0;
	for (var i = 0, j = polygon.length - 1; i < polygon.length; j=i,i++) {
		point1 = polygon[i];
		point2 = polygon[j];
		f = point1[0] * point2[1] - point2[0] * point1[1];
		x += (point1[0] + point2[0]) * f;
		y += (point1[1] + point2[1]) * f;
	}
	f = PolygonTools.getArea(polygon) * 6;
	return {0:x/f, 1:y/f};
};

function sqDist(p, q) {
	return Math.pow(p[0]-q[0],2) + Math.pow(p[1]-q[1],2);
}

PolygonTools.getDistanceFromSegment = function(p, v, w) {
	var l2 = sqDist(v, w);
	if (l2 == 0) return sqDist(p, v);
	var t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
	if (t < 0) return sqDist(p, v);
	if (t > 1) return sqDist(p, w);
	return Math.sqrt(sqDist(p, { 0: v[0] + t * (w[0] - v[0]), 1: v[1] + t * (w[1] - v[1]) }));
};

PolygonTools.getMinDistanceFromEdge = function(polygon, point) {
	var minDistance = Number.POSITIVE_INFINITY;
	for (var i = 0; i < polygon.length; i++) {
		var currentDistance = PolygonTools.getDistanceFromSegment(point, polygon[i], polygon[(i+1)%polygon.length]);
		minDistance = Math.min(currentDistance, minDistance);
	}
	return minDistance;
};

//returns a value between 0 and 1 that expresses how far the given point is the given polygon
PolygonTools.howFarIsPointInPolygon = function(polygon, centroid, point) {
	if (PolygonTools.isPointInPolygon(polygon, point)) {
		var centroidDistance = Math.sqrt(Math.pow(point[0]-centroid[0], 2) + Math.pow(point[1]-centroid[1], 2));
		var edgeDistance = PolygonTools.getMinDistanceFromEdge(polygon, point);
		return Math.sqrt((1-centroidDistance)*edgeDistance/Math.abs(centroidDistance+edgeDistance));
	}
	return 0;
};

PolygonTools.getPolygonFunctionArgs = function(polygon) {
	return ["a", "b", "return PolygonTools.isPointInPolygon(" + getPolygonOrPointString(polygon) + ", {0:a, 1:b});"];
};

PolygonTools.getInterpolatedPolygonFunctionArgs = function(polygon) {
	var polygonString = getPolygonOrPointString(polygon);
	var centroidString = getPolygonOrPointString(PolygonTools.getCentroid(polygon));
	return ["a", "b", "return PolygonTools.howFarIsPointInPolygon(" + polygonString + "," + centroidString + ", {0:a, 1:b});"];
};

function getPolygonOrPointString(polygonOrPoint) {
	return JSON.stringify(polygonOrPoint).replace(/"/g, "'");
}