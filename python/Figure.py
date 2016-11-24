#!/usr/bin/env python
#
# ======================================================================
#
#                           Brad T. Aagaard
#                        U.S. Geological Survey
#
# ======================================================================
#

import numpy

import matplotlib
import matplotlib.pyplot as pyplot
from matplotlib.colors import LinearSegmentedColormap

# ----------------------------------------------------------------------
class Figure(object):

    def __init__(self, color="lightbg", fontsize=8):
        """
        Constructor.
        """
        self.figure = None
        self.colorstyle = color
        self.defaults = {
            'figure.facecolor': 'bg',
            'figure.edgecolor': 'fg',
            'axes.facecolor': 'bg',
            'axes.edgecolor': 'fg',
            'axes.labelcolor': 'fg',
            'axes.labelsize': fontsize,
            'axes.titlesize': fontsize,
            'font.size': fontsize,
            'text.color': 'fg',
            'legend.fontsize': fontsize,
            'grid.color': 'fg',
            'xtick.labelsize': fontsize,
            'xtick.color': 'fg',
            'ytick.labelsize': fontsize,
            'ytick.color': 'fg',
            'savefig.facecolor': 'bg',
            'savefig.edgecolor': 'bg',
            }

        eqcolors = {
            'red': [
                (0.0, 0, 1.0),
                (1.0/(24*30), 1.0, 0.96),
                (1.0/30, 0.96, 1.0),
                (7.0/30, 1.0, 1.0),
                (1.0, 1.0, 0)],
            'green': [
                (0.0, 0, 0.0),
                (1.0/(24*30), 0.0, 0.5),
                (1.0/30, 0.5, 1.0),
                (7.0/30, 1.0, 1.0),
                (1.0, 1.0, 0)],
            'blue': [
                (0.0, 0, 0.0),
                (1.0/(24*30), 0.0, 0.0),
                (1.0/30, 0.0, 0.0),
                (7.0/30, 0.0, 1.0),
                (1.0, 1.0, 0)]
            }
        self.eqcmap = LinearSegmentedColormap("usgs_eqs", eqcolors)
        return


    def open(self, width, height, margins=((0.5, 0.5, 0.1), (0.5, 0.5, 0.1)), dpi=90):
        """
        Open figure.
        """
        self._setup()
        for setting in self.defaults.items():
            matplotlib.rcParams[setting[0]] = setting[1]
        self.figure = pyplot.figure(
            figsize=(width, height),
            facecolor='bg',
            dpi=dpi,
            frameon=False)
        self.figure.set_facecolor('bg')
        self.margins = margins
        return


    def close(self):
        """
        Close figure.
        """
        pyplot.close(self.figure)
        self.figure = None
        return


    def axes(self, nrows, ncols, row, col, hide=False):
        """
        Create subplot in figure.
        """
        height = self.figure.get_figheight()
        width = self.figure.get_figwidth()
        margins = self.margins
        marginLeft = margins[0][0]
        hsep = margins[0][1]
        marginRight = margins[0][2]
        marginBottom = margins[1][0]
        vsep = margins[1][1]
        marginTop = margins[1][2]
        plotW = (width-marginRight-marginLeft-hsep*int(ncols-1))/float(ncols)
        plotH = (height-marginTop-marginBottom-vsep*int(nrows-1))/float(nrows)

        left = (marginLeft+(col-1)*(plotW+hsep)) / width
        if col <= ncols:
            right = left + plotW/width
        else:
            right = 1.0 - marginRight/width
        plotW = (right-left)*width
        bottom = (marginBottom+(nrows-row)*(plotH+vsep)) / height
        top = bottom + plotH / height
        #print "left: %.4f, right: %.4f, top: %.4f, bottom: %.4f, width: %.4f, height: %.4f" % \
        #      (left, right, top, bottom, plotW/w, plotH/h)
        axes = self.figure.add_axes([left, bottom, plotW/width, plotH/height], axisbg='bg')

        if hide:
            axes.set_frame_on(False)
            axes.set_axis_bgcolor(None)
            axes.set_xticks([])
            axes.set_yticks([])

        self._colorticks(axes)
        return axes


    def _setup(self):
        if self.colorstyle == "lightbg":
            fg = (0.0001, 0.0001, 0.0001)
            bg = (0.9999, 0.9999, 0.9999)
        elif self.colorstyle == "darkbg":
            fg = (0.9999, 0.9999, 0.9999)
            bg = (0.18, 0.21, 0.28)
        elif self.colorstyle == "blackbg":
            fg = (0.9999, 0.9999, 0.9999)
            bg = (0.0001, 0.0001, 0.0001)


        colors = {
            'fg': fg,
            'bg': bg,
            'dkgray': (0.25, 0.25, 0.25),
            'mdgray': (0.5, 0.5, 0.5),
            'ltgray': (0.75, 0.75, 0.75),
            'dkslate': (0.18, 0.21, 0.28),
            'slate': (0.45, 0.50, 0.68),
            'ltorange': (1.0, 0.74, 0.41),
            'orange': (0.96, 0.50, 0.0),
            'ltred': (1.0, 0.25, 0.25),
            'red': (0.79, 0.00, 0.01),
            'ltblue': (0.2, 0.73, 1.0),
            'blue': (0.12, 0.43, 0.59),
            'ltgreen': (0.37, 0.80, 0.05),
            'green': (0.23, 0.49, 0.03),
            'ltpurple': (0.81, 0.57, 1.0),
            'purple': (0.38, 0.00, 0.68)}
        from matplotlib.colors import colorConverter
        for key in colors.keys():
            colorConverter.colors[key] = colors[key]
        return


    def _colorticks(self, axes):
        ticklines = axes.get_xticklines()
        for tickline in ticklines:
            tickline.set_color('fg')
            ticklines = axes.get_yticklines()
        for tickline in ticklines:
            tickline.set_color('fg')
        return


    def _setylim(self, data, lims):
        ymax = 0.0
        (npts, ncomps) = data.shape
        for icomp in xrange(ncomps):
            cmax = numpy.max(numpy.abs(data[:, icomp]))
        if cmax > ymax:
            ymax = cmax
        if ymax < lims[0]:
            ylim = lims[0]
        else:
            ii = numpy.where(ymax > lims)[0][-1]
            if ii+1 < len(lims):
                ylim = lims[ii+1]
            else:
                ylim = lims[ii]
        return ylim


# End of file
