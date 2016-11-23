#!/usr/bin/env python

import argparse

from Seismicity import Seismicity
from PlotMagTime import PlotMagTime
from PlotXSections import PlotXSections

# ----------------------------------------------------------------------
class App:

    def __init__(self, earthquakes):
        """
        Constructor.
        """
        self.seismicity = Seismicity(earthquakes)
        return


    def plotTime(self):
        figure = PlotMagTime()
        figure.plot(self.seismicity)
        figure.save("mag_time.png")
        return


    def plotXSections(self):
        figure = PlotXSections()
        figure.plot(self.seismicity)
        figure.save("xsections.png")
        return



# ======================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--earthquakes", action="store", dest="earthquakes")
    parser.add_argument("--plot-time", actions="store_true", dest="plotTime")
    parser.add_argument("--plot_xsections", actions="store_true", dest="plotXSections")
    args = parser.parse_args()

    app = App()
    if args.earthquakes:
        import json
        seismicity = json.loads(args.earthquakes)
    else:
        import json
        with open("earthquakes.json", "r") as fin:
            seismicity = json.load(fin)

    if args.plotTime:
        app.plotTime()

    if args.plotXSections:
        app.plotXSections()


# End of file
