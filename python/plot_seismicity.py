#!/usr/bin/env python

import argparse
import datetime

from Seismicity import Seismicity
from PlotMagTime import PlotMagTime
#from .PlotXSections import PlotXSections

# ----------------------------------------------------------------------
class PlotApp:

    def __init__(self, earthquakes):
        """
        Constructor.
        """
        self.seismicity = Seismicity(earthquakes, format="json")
        self.now = datetime.datetime.utcnow()
        return


    def plot_time(self):
        figure = PlotMagTime(self.now)
        figure.plot(self.seismicity)
        figure.save("mag_time.png")
        return


    def plot_xsections(self):
        self.project()
        #figure = PlotXSections()
        #figure.plot(self.seismicity)
        #figure.save("xsections.png")
        return



# ======================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--earthquakes", action="store", dest="earthquakes")
    parser.add_argument("--plot-time", action="store_true", dest="plotTime")
    parser.add_argument("--plot_xsections", action="store_true", dest="plotXSections")
    args = parser.parse_args()

    if args.earthquakes:
        import json
        seismicity = json.loads(args.earthquakes)
    else:
        import json
        with open("earthquakes.json", "r") as fin:
            seismicity = json.load(fin)

    app = PlotApp(seismicity)

    if args.plotTime:
        app.plot_time()

    if args.plotXSections:
        app.plot_xsections()


# End of file
