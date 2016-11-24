import json
import numpy
import math
import dateutil.parser

import pyproj
from matplotlib.dates import date2num

# ----------------------------------------------------------------------
class Mainshock:

    def __init__(self, earthquake, format="json"):
        if format == "json":
            self._from_json(earthquake)
        else:
            raise ValueError("Unknown format '%s'." % format)
        return

    def project(self):
        utmZone = int(math.floor((self.longitude+180)/6)+1)
        proj = pyproj.Proj(proj="utm", zone=utmZone, ellps='WGS84')
        (self.x, self.y) = proj(self.longitude, self.latitude)
        return proj
        
    def _from_json(self, earthquake):
        self.originTime = date2num(dateutil.parser.parse(earthquake["originTime"]))
        self.magnitude = earthquake["magnitude"]
        self.latitude = earthquake["latitude"]
        self.longitude = earthquake["longitude"]
        self.depth = earthquake["depth"]
        return

    
# ----------------------------------------------------------------------
class Catalog:

    def __init__(self, earthquakes, format=json):
        if format == "json":
            self._from_json(earthquakes)
        else:
            raise ValueError("Unknown format '%s'." % format)
        return


    def project(self, proj):
        self.x, self.y = proj(self.longitude, self.latitude)
        return
    
    def _from_json(self, earthquakes):
        size = len(earthquakes)
        self.count = size
        self.originTime = numpy.zeros((size,))
        self.longitude = numpy.zeros((size,))
        self.latitude = numpy.zeros((size,))
        self.depth = numpy.zeros((size,))
        self.magnitude = numpy.zeros((size,))

        for i,earthquake in enumerate(earthquakes):
            self.originTime[i] = date2num(dateutil.parser.parse(earthquake["originTime"]))
            self.longitude[i] = earthquake["longitude"]
            self.latitude[i] = earthquake["latitude"]
            self.depth[i] = earthquake["depth"]
            self.magnitude[i] = earthquake["magnitude"]
        return
    

# ----------------------------------------------------------------------
class Seismicity:

    def __init__(self, earthquakes, format):
        """
        Constructor.
        """
        self.mainshock = Mainshock(earthquakes["mainshock"])
        self.aftershocks = Catalog(earthquakes["aftershocks"], format)
        self.historical = Catalog(earthquakes["historical"], format)

        return

    def project(self):
        proj = self.mainshock.project()
        self.aftershocks.project(proj)
        self.historical.project(proj)

# End of file
