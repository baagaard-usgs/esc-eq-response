"""
Module for managing seismicity information for plotting.
"""

import json
import numpy
import math
import datetime

import pyproj
from matplotlib.dates import date2num

# ----------------------------------------------------------------------
class Mainshock(object):
    """
    Mainshock information.
    """

    def __init__(self, earthquake, format="geojson"):
        """
        Constructor.

        Parameters
        ----------
        earthquake: Object containing mainshock information.
        format: Format defining layout of object.
        """
        if format == "geojson":
            self._from_geojson(earthquake)
        else:
            raise ValueError("Unknown format '%s'." % format)

        self.originTime = None
        self.magnitude = None
        self.longitude = None
        self.latitude = None
        self.depth = None
        self.x = None
        self.y = None
        return

    def project(self):
        """
        Create projection and project mainshock.
        """
        utmZone = int(math.floor((self.longitude+180)/6)+1)
        proj = pyproj.Proj(proj="utm", zone=utmZone, ellps="WGS84")
        (self.x, self.y) = proj(self.longitude, self.latitude)
        return proj

    def _from_geojson(self, earthquake):
        """
        Extract information loaded from geojson file.

        Parameters
        ----------
        earthquake: Object containing mainshock information.
        """
        properties = earthquake["properties"]
        self.originTime = date2num(datetime.datetime.fromtimestamp(0.001*properties["time"]))
        self.magnitude = properties["mag"]

        coordinates = earthquake["geometry"]["coordinates"]
        self.longitude = coordinates[0]
        self.latitude = coordinates[1]
        self.depth = coordinates[2]
        return


# ----------------------------------------------------------------------
class Catalog(object):
    """
    Seismicity catalog (aftershocks, historical).
    """

    def __init__(self, earthquakes, format="geojson"):
        """
        Constructor.

        Parameters
        ----------
        earthquakes: Object containing earthquake information.
        format: Format defining layout of earthquke information.
        """
        if format == "geojson":
            self._from_geojson(earthquakes)
        else:
            raise ValueError("Unknown format '%s'." % format)

        self.count = None
        self.originTime = None
        self.magnitude = None
        self.longitude = None
        self.latitude = None
        self.depth = None
        self.x = None
        self.y = None
        return

    def project(self, proj):
        """
        Project earthquake locations.

        Parameters
        ----------
        proj: Projection object to use.
        """
        self.x, self.y = proj(self.longitude, self.latitude)
        return

    def _from_geojson(self, earthquakes):
        """
        Extract information loaded from geojson file.

        Parameters
        ----------
        earthquake: Object containing mainshock information.
        """
        size = len(earthquakes["features"])
        self.count = size
        self.originTime = numpy.zeros((size,))
        self.longitude = numpy.zeros((size,))
        self.latitude = numpy.zeros((size,))
        self.depth = numpy.zeros((size,))
        self.magnitude = numpy.zeros((size,))

        for i, earthquake in enumerate(earthquakes["features"]):
            properties = earthquake["properties"]
            self.originTime[i] = date2num(datetime.datetime.fromtimestamp(0.001*properties["time"]))
            self.magnitude[i] = properties["mag"]

            coordinates = earthquake["geometry"]["coordinates"]
            self.longitude[i] = coordinates[0]
            self.latitude[i] = coordinates[1]
            self.depth[i] = coordinates[2]
        return


# ----------------------------------------------------------------------
class Seismicity(object):
    """
    Collection of seismicity associated with a mainshock, including
    the mainshock, aftershocks, and historical earthquakes.
    """

    def __init__(self, mainshock, aftershocks, historical, format=json):
        """
        Constructor.
        """
        self.mainshock = Mainshock(mainshock, format)
        self.aftershocks = Catalog(aftershocks, format)
        self.historical = Catalog(historical, format)

        return

    def project(self):
        """
        Project earthquake locations from geographic coordinates to UTM coordinates.
        """
        proj = self.mainshock.project()
        self.aftershocks.project(proj)
        self.historical.project(proj)

# End of file
