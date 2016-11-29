#!/usr/bin/env python
"""
Python script to plot seismicity magnitude vs. time and cross sections.
"""

import argparse
import datetime
import json

from Seismicity import Seismicity
from PlotMagTime import PlotMagTime
#from .PlotXSections import PlotXSections

# ----------------------------------------------------------------------
class PlotApp(object):
    """
    Application driver for plotting seismicity magnitude versus time
    and cross sections.

    """

    def __init__(self, earthquakes):
        """
        Constructor.
        """
        self.seismicity = earthquakes
        self.now = datetime.datetime.utcnow()
        return

    def plot_time(self):
        """
        Plot magnitude versus time.
        """
        figure = PlotMagTime(self.now)
        figure.plot(self.seismicity)
        figure.save("mag_time.png")
        return

    def plot_xsections(self):
        """
        Plot strike-parallel verus depth and strike-perpendicular versus
        depth cross sections.

        """
        self.seismicity.project()
        #figure = PlotXSections()
        #figure.plot(self.seismicity)
        #figure.save("xsections.png")
        return


# ----------------------------------------------------------------------
def load_catalog(catalog, filename):
    """
    Load catalog from string or file if string is not provided.
    """
    if catalog:
        earthquakes = json.loads(catalog)
    else:
        with open(filename, "r") as fin:
            earthquakes = json.load(fin)
    return earthquakes


# ======================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mainshock", action="store", dest="mainshock")
    parser.add_argument("--aftershocks", action="store", dest="aftershocks")
    parser.add_argument("--historical", action="store", dest="historical")
    parser.add_argument("--plot-time", action="store_true", dest="plotTime")
    parser.add_argument("--plot_xsections", action="store_true", dest="plotXSections")
    args = parser.parse_args()

    mainshock = load_catalog(args.mainshock, "mainshock.json")
    aftershocks = load_catalog(args.aftershocks, "aftershocks.json")
    historical = load_catalog(args.historical, "historical.json")

    seismicity = Seismicity(mainshock, aftershocks, historical, format="geojson")

    app = PlotApp(seismicity)

    if args.plotTime:
        app.plot_time()

    if args.plotXSections:
        app.plot_xsections()


# End of file
